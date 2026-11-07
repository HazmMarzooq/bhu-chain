import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sha256, verifyDocument, BlockStructure } from "@/lib/blockchain/bhu-chain";
import { getSessionUser } from "@/lib/auth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: { ulpin: string } }
) {
  try {
    const ulpin = params.ulpin.trim().toUpperCase();
    const body = await req.json();
    const { documentHash, documentContent, fileName } = body;

    let computedHash = "";
    if (documentHash && documentHash.trim()) {
      computedHash = documentHash.trim().toLowerCase();
    } else if (documentContent) {
      computedHash = sha256(documentContent).toLowerCase();
    } else {
      return NextResponse.json(
        { error: "Provide either documentContent string or documentHash." },
        { status: 400 }
      );
    }

    const parcel = await prisma.parcel.findUnique({
      where: { ulpin },
      include: {
        events: {
          orderBy: { blockNumber: "asc" },
        },
      },
    });

    if (!parcel) {
      return NextResponse.json(
        { error: `Parcel with ULPIN ${ulpin} not found on the registry.` },
        { status: 404 }
      );
    }

    const verification = verifyDocument(
      computedHash,
      parcel.events as unknown as BlockStructure[]
    );

    const user = await getSessionUser();
    await recordAuditLog({
      action: verification.isAuthentic ? "DOCUMENT_VERIFIED_AUTHENTIC" : "DOCUMENT_VERIFIED_FORGERY_DETECTED",
      performedBy: user ? user.name : "CITIZEN_PUBLIC",
      userRole: user ? user.role : "CITIZEN",
      ulpin,
      details: `${verification.isAuthentic ? "Authentic" : "Forged / Tampered"} document verification attempt. File: ${fileName || "N/A"}, Hash: ${computedHash.slice(0, 16)}...`,
    });

    return NextResponse.json({
      success: true,
      ulpin,
      uploadedHash: computedHash,
      fileName: fileName || "Untitled Document",
      isAuthentic: verification.isAuthentic,
      matchedEvent: verification.matchedEvent || null,
      details: verification.details,
      approvedChainHashes: parcel.events.map((ev) => ({
        blockNumber: ev.blockNumber,
        eventType: ev.eventType,
        documentTitle: ev.documentTitle,
        documentHash: ev.documentHash,
        approvalTimestamp: ev.approvalTimestamp,
      })),
    });
  } catch (error: any) {
    console.error("verify-document error:", error);
    return NextResponse.json(
      { error: "Failed to verify document hash against blockchain ledger" },
      { status: 500 }
    );
  }
}
