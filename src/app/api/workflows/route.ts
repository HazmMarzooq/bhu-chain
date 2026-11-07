import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { sha256, hashIdentity } from "@/lib/blockchain/bhu-chain";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const ulpin = searchParams.get("ulpin");
    const type = searchParams.get("type");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (ulpin) where.ulpin = ulpin.trim().toUpperCase();
    if (type && type !== "ALL") where.requestType = type;

    const requests = await prisma.workflowRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        parcel: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: requests.length,
      requests,
    });
  } catch (error: any) {
    console.error("GET /api/workflows error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to initiate workflows." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      ulpin,
      requestType, // SALE, MORTGAGE, PLEDGE_RELEASE, DISPUTE
      sellerName,
      buyerName,
      buyerIdentityNumber,
      bankName,
      loanAmount,
      disputeReason,
      documentTitle,
      documentContent,
      remarks,
    } = body;

    if (!ulpin || !requestType) {
      return NextResponse.json(
        { error: "ULPIN and requestType are required." },
        { status: 400 }
      );
    }

    const parcel = await prisma.parcel.findUnique({
      where: { ulpin: ulpin.trim().toUpperCase() },
    });

    if (!parcel) {
      return NextResponse.json(
        { error: `Parcel ${ulpin} not found.` },
        { status: 404 }
      );
    }

    // WORKFLOW VALIDATIONS
    if (requestType === "SALE") {
      // 1. Seller match check
      if (sellerName && sellerName.trim().toLowerCase() !== parcel.ownerName.trim().toLowerCase()) {
        return NextResponse.json(
          {
            error: `Sale transaction rejected: Declared seller "${sellerName}" does not match the approved on-chain owner "${parcel.ownerName}".`,
          },
          { status: 400 }
        );
      }

      // 2. Dispute check
      if (parcel.disputeStatus === "ACTIVE_DISPUTE") {
        return NextResponse.json(
          {
            error: `Sale blocked: Parcel ${parcel.ulpin} is locked under an active legal dispute (${parcel.disputeDetails || "Court/Revenue dispute"}).`,
          },
          { status: 400 }
        );
      }

      // 3. Encumbrance check
      if (parcel.encumbranceStatus === "MORTGAGED" || parcel.encumbranceStatus === "LIEN") {
        return NextResponse.json(
          {
            error: `Sale blocked: Parcel ${parcel.ulpin} is currently encumbered (${parcel.encumbranceBank ? `Mortgaged to ${parcel.encumbranceBank}` : "Active Lien"}). Pledge release required first.`,
          },
          { status: 400 }
        );
      }

      if (!buyerName) {
        return NextResponse.json(
          { error: "Buyer name is required for sale deed registration." },
          { status: 400 }
        );
      }
    }

    if (requestType === "MORTGAGE") {
      if (parcel.encumbranceStatus === "MORTGAGED") {
        return NextResponse.json(
          { error: `Parcel ${parcel.ulpin} is already mortgaged to ${parcel.encumbranceBank || "another financial institution"}.` },
          { status: 400 }
        );
      }
      if (parcel.disputeStatus === "ACTIVE_DISPUTE") {
        return NextResponse.json(
          { error: `Mortgage blocked: Parcel has an active dispute pending resolution.` },
          { status: 400 }
        );
      }
    }

    if (requestType === "PLEDGE_RELEASE") {
      if (parcel.encumbranceStatus !== "MORTGAGED") {
        return NextResponse.json(
          { error: `Parcel ${parcel.ulpin} is not currently mortgaged.` },
          { status: 400 }
        );
      }
    }

    const docHash = documentContent
      ? sha256(documentContent)
      : sha256(`DOC_${requestType}_${ulpin}_${Date.now()}`);

    const buyerIdentityHash = buyerIdentityNumber
      ? hashIdentity(buyerIdentityNumber)
      : buyerName
      ? hashIdentity(`${buyerName}_ID`)
      : null;

    // Set initial status based on request type
    let initialStatus = "PENDING_REGISTRAR";
    if (requestType === "MORTGAGE" || requestType === "PLEDGE_RELEASE" || requestType === "DISPUTE") {
      initialStatus = "PENDING_REVENUE";
    }

    const request = await prisma.workflowRequest.create({
      data: {
        ulpin: parcel.ulpin,
        requestType,
        status: initialStatus,
        requestedByUserId: user.id,
        requestedByName: user.name,
        sellerName: sellerName || parcel.ownerName,
        buyerName: buyerName || null,
        buyerIdentityHash,
        bankName: bankName || null,
        loanAmount: loanAmount ? parseFloat(loanAmount) : null,
        disputeReason: disputeReason || null,
        documentTitle: documentTitle || `${requestType.replace("_", " ")} Application (${parcel.ulpin})`,
        documentHash: docHash,
        remarks: remarks || null,
      },
    });

    await recordAuditLog({
      action: `WORKFLOW_INITIATED_${requestType}`,
      performedBy: user.name,
      userRole: user.role,
      ulpin: parcel.ulpin,
      details: `Initiated ${requestType} request #${request.id} for ${parcel.ulpin}. Status: ${initialStatus}`,
    });

    return NextResponse.json({
      success: true,
      message: `${requestType} request initiated successfully. Sent to ${initialStatus.replace("PENDING_", "")} queue.`,
      request,
    });
  } catch (error: any) {
    console.error("POST /api/workflows error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create workflow request" },
      { status: 500 }
    );
  }
}
