import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { createNewBlock, GENESIS_PREV_HASH } from "@/lib/blockchain/bhu-chain";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await req.json();
    const { action, rejectionReason } = body; // "APPROVE" | "REJECT"

    const request = await prisma.workflowRequest.findUnique({
      where: { id: params.id },
      include: { parcel: { include: { events: { orderBy: { blockNumber: "asc" } } } } },
    });

    if (!request) {
      return NextResponse.json({ error: "Workflow request not found." }, { status: 404 });
    }

    if (request.status === "APPROVED" || request.status === "REJECTED") {
      return NextResponse.json(
        { error: `This request has already been finalized as ${request.status}.` },
        { status: 400 }
      );
    }

    // Role-based action guard
    if (request.status === "PENDING_REGISTRAR") {
      if (user.role !== "SUB_REGISTRAR" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only a Sub-Registrar can verify this stage." },
          { status: 403 }
        );
      }
    } else if (request.status === "PENDING_REVENUE") {
      if (user.role !== "REVENUE_OFFICER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Only a Revenue Officer can approve mutation/encumbrance." },
          { status: 403 }
        );
      }
    }

    // HANDLE REJECTION
    if (action === "REJECT") {
      const updated = await prisma.workflowRequest.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Rejected by reviewing authority.",
        },
      });

      await recordAuditLog({
        action: `WORKFLOW_REJECTED_${request.requestType}`,
        performedBy: user.name,
        userRole: user.role,
        ulpin: request.ulpin,
        details: `Request #${request.id} rejected by ${user.name} (${user.role}). Reason: ${rejectionReason || "None specified"}`,
      });

      return NextResponse.json({
        success: true,
        message: "Request rejected.",
        request: updated,
      });
    }

    // HANDLE APPROVAL
    const parcel = request.parcel;
    const currentEvents = parcel.events;
    const lastEvent = currentEvents[currentEvents.length - 1];
    let prevHash = lastEvent ? lastEvent.currentRecordHash : GENESIS_PREV_HASH;
    let currentHeight = currentEvents.length;

    // STEP A: SUB_REGISTRAR VERIFIES SALE -> PENDING_REVENUE
    if (request.status === "PENDING_REGISTRAR" && request.requestType === "SALE") {
      const updated = await prisma.workflowRequest.update({
        where: { id: params.id },
        data: { status: "PENDING_REVENUE" },
      });

      await recordAuditLog({
        action: "SALE_DEED_VERIFIED_BY_REGISTRAR",
        performedBy: user.name,
        userRole: user.role,
        ulpin: parcel.ulpin,
        details: `Sale deed verified by Sub-Registrar ${user.name}. Forwarded to Revenue Officer for mutation approval.`,
      });

      return NextResponse.json({
        success: true,
        message: "Sale deed documentation verified. Forwarded to Revenue Department for Mutation Approval.",
        request: updated,
      });
    }

    // STEP B: REVENUE OFFICER FINAL APPROVALS & BLOCKCHAIN COMMIT

    // Case 1: SALE -> Appends SALE_DEED and MUTATION_APPROVAL to Blockchain
    if (request.requestType === "SALE") {
      const buyerName = request.buyerName || "New Owner";
      const buyerIdentityHash = request.buyerIdentityHash || "BUYER_HASH";

      // Block 1: SALE_DEED event
      const saleBlock = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType: "SALE_DEED",
          previousOwnerHash: parcel.ownerIdentityHash,
          newOwnerHash: buyerIdentityHash,
          documentHash: request.documentHash || "DOC_SALE_HASH",
          documentTitle: `Registered Sale Deed (Seller: ${parcel.ownerName} -> Buyer: ${buyerName})`,
          registrationOfficeId: user.officeId || "TN-SRO-01",
          approverDigitalId: `RO-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
          approvalTimestamp: new Date(),
          previousEventHash: prevHash,
          metadata: { seller: parcel.ownerName, buyer: buyerName },
        },
        currentHeight
      );

      await prisma.blockchainEvent.create({ data: { ...saleBlock } });
      prevHash = saleBlock.currentRecordHash;
      currentHeight++;

      // Block 2: MUTATION_APPROVAL event
      const mutationBlock = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType: "MUTATION_APPROVAL",
          previousOwnerHash: parcel.ownerIdentityHash,
          newOwnerHash: buyerIdentityHash,
          documentHash: request.documentHash || "DOC_MUTATION_HASH",
          documentTitle: `Approved Land Mutation Order (Title Transferred to ${buyerName})`,
          registrationOfficeId: user.officeId || "TN-REV-01",
          approverDigitalId: `RO-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
          approvalTimestamp: new Date(),
          previousEventHash: prevHash,
          metadata: { order: "Patta Transfer Approved" },
        },
        currentHeight
      );

      await prisma.blockchainEvent.create({ data: { ...mutationBlock } });

      // Update Parcel record
      await prisma.parcel.update({
        where: { ulpin: parcel.ulpin },
        data: {
          ownerName: buyerName,
          ownerIdentityHash: buyerIdentityHash,
          lastMutationDate: new Date(),
          status: "APPROVED",
        },
      });

      await prisma.workflowRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      });

      await recordAuditLog({
        action: "MUTATION_APPROVED_ON_BLOCKCHAIN",
        performedBy: user.name,
        userRole: user.role,
        ulpin: parcel.ulpin,
        details: `Mutation approved for ${parcel.ulpin}. Ownership transferred to ${buyerName}. Blocks #${saleBlock.blockNumber} and #${mutationBlock.blockNumber} appended to Bhu-Chain.`,
      });

      return NextResponse.json({
        success: true,
        message: `Sale deed and mutation approved. Blockchain events #${saleBlock.blockNumber} and #${mutationBlock.blockNumber} committed.`,
      });
    }

    // Case 2: MORTGAGE -> Encumbers parcel and appends MORTGAGE event
    if (request.requestType === "MORTGAGE") {
      const mortgageBlock = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType: "MORTGAGE",
          previousOwnerHash: parcel.ownerIdentityHash,
          newOwnerHash: parcel.ownerIdentityHash,
          documentHash: request.documentHash || "DOC_MORTGAGE_HASH",
          documentTitle: `Registered Mortgage Deed (Lender: ${request.bankName || "Bank"}, Amount: ₹${request.loanAmount || 0})`,
          registrationOfficeId: user.officeId || "TN-REV-01",
          approverDigitalId: `RO-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
          approvalTimestamp: new Date(),
          previousEventHash: prevHash,
          metadata: { bank: request.bankName, loanAmount: request.loanAmount },
        },
        currentHeight
      );

      await prisma.blockchainEvent.create({ data: { ...mortgageBlock } });

      await prisma.parcel.update({
        where: { ulpin: parcel.ulpin },
        data: {
          encumbranceStatus: "MORTGAGED",
          encumbranceBank: request.bankName,
          status: "ENCUMBERED",
        },
      });

      await prisma.workflowRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      });

      await recordAuditLog({
        action: "MORTGAGE_APPROVED_ON_BLOCKCHAIN",
        performedBy: user.name,
        userRole: user.role,
        ulpin: parcel.ulpin,
        details: `Mortgage approved for ${parcel.ulpin} in favor of ${request.bankName}. Block #${mortgageBlock.blockNumber} committed. Parcel is now Encumbered.`,
      });

      return NextResponse.json({
        success: true,
        message: `Mortgage approved and recorded on blockchain block #${mortgageBlock.blockNumber}. Parcel marked as Encumbered.`,
      });
    }

    // Case 3: PLEDGE_RELEASE -> Clears mortgage and appends PLEDGE_RELEASE event
    if (request.requestType === "PLEDGE_RELEASE") {
      const releaseBlock = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType: "PLEDGE_RELEASE",
          previousOwnerHash: parcel.ownerIdentityHash,
          newOwnerHash: parcel.ownerIdentityHash,
          documentHash: request.documentHash || "DOC_RELEASE_HASH",
          documentTitle: `No-Objection Certificate & Deed of Reconveyance (${request.bankName || "Bank"})`,
          registrationOfficeId: user.officeId || "TN-REV-01",
          approverDigitalId: `RO-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
          approvalTimestamp: new Date(),
          previousEventHash: prevHash,
          metadata: { bank: request.bankName, status: "Loan Discharged" },
        },
        currentHeight
      );

      await prisma.blockchainEvent.create({ data: { ...releaseBlock } });

      await prisma.parcel.update({
        where: { ulpin: parcel.ulpin },
        data: {
          encumbranceStatus: "NONE",
          encumbranceBank: null,
          status: parcel.disputeStatus === "ACTIVE_DISPUTE" ? "DISPUTED" : "APPROVED",
        },
      });

      await prisma.workflowRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      });

      await recordAuditLog({
        action: "PLEDGE_RELEASE_APPROVED",
        performedBy: user.name,
        userRole: user.role,
        ulpin: parcel.ulpin,
        details: `Pledge release approved for ${parcel.ulpin}. Mortgage cleared. Block #${releaseBlock.blockNumber} committed.`,
      });

      return NextResponse.json({
        success: true,
        message: `Pledge release approved and recorded on blockchain block #${releaseBlock.blockNumber}. Encumbrance removed.`,
      });
    }

    // Case 4: DISPUTE -> Flags dispute or Resolves dispute
    if (request.requestType === "DISPUTE") {
      const isResolving = parcel.disputeStatus === "ACTIVE_DISPUTE";
      const eventType = isResolving ? "RECORD_CORRECTION" : "DISPUTE_FLAG";
      const docTitle = isResolving
        ? `Court / Revenue Order Dismissing Dispute (${request.disputeReason || "Settlement"})`
        : `Court / Revenue Injunction & Dispute Order (${request.disputeReason || "Title Dispute"})`;

      const disputeBlock = createNewBlock(
        {
          ulpin: parcel.ulpin,
          eventType,
          previousOwnerHash: parcel.ownerIdentityHash,
          newOwnerHash: parcel.ownerIdentityHash,
          documentHash: request.documentHash || "DOC_DISPUTE_HASH",
          documentTitle: docTitle,
          registrationOfficeId: user.officeId || "TN-REV-01",
          approverDigitalId: `RO-${user.name.toUpperCase().replace(/\s+/g, "_")}`,
          approvalTimestamp: new Date(),
          previousEventHash: prevHash,
          metadata: { reason: request.disputeReason, isResolved: isResolving },
        },
        currentHeight
      );

      await prisma.blockchainEvent.create({ data: { ...disputeBlock } });

      await prisma.parcel.update({
        where: { ulpin: parcel.ulpin },
        data: {
          disputeStatus: isResolving ? "RESOLVED" : "ACTIVE_DISPUTE",
          disputeDetails: isResolving ? null : request.disputeReason,
          status: isResolving ? (parcel.encumbranceStatus === "MORTGAGED" ? "ENCUMBERED" : "APPROVED") : "DISPUTED",
        },
      });

      await prisma.workflowRequest.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      });

      await recordAuditLog({
        action: isResolving ? "DISPUTE_RESOLVED" : "DISPUTE_FLAGGED",
        performedBy: user.name,
        userRole: user.role,
        ulpin: parcel.ulpin,
        details: `${isResolving ? "Resolved dispute on" : "Flagged active dispute on"} ${parcel.ulpin}. Block #${disputeBlock.blockNumber} committed.`,
      });

      return NextResponse.json({
        success: true,
        message: `${isResolving ? "Dispute resolved" : "Dispute flagged"} on blockchain block #${disputeBlock.blockNumber}.`,
      });
    }

    return NextResponse.json({ error: "Unsupported workflow request type." }, { status: 400 });
  } catch (error: any) {
    console.error("Workflow action error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process workflow action" },
      { status: 500 }
    );
  }
}
