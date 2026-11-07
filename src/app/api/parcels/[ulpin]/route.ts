import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { verifyChainIntegrity, BlockStructure } from "@/lib/blockchain/bhu-chain";
import { recordAuditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { ulpin: string } }
) {
  try {
    const ulpin = params.ulpin.trim().toUpperCase();

    const parcel = await prisma.parcel.findUnique({
      where: { ulpin },
      include: {
        events: {
          orderBy: { blockNumber: "asc" },
        },
        requests: {
          where: {
            status: { in: ["PENDING_REGISTRAR", "PENDING_REVENUE"] },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!parcel) {
      return NextResponse.json(
        { error: `No land parcel found with ULPIN: ${ulpin}` },
        { status: 404 }
      );
    }

    // Verify blockchain integrity for this parcel
    const chainVerification = verifyChainIntegrity(
      parcel.events as unknown as BlockStructure[]
    );

    const user = await getSessionUser();
    await recordAuditLog({
      action: "PARCEL_LOOKUP",
      performedBy: user ? user.name : "CITIZEN_PUBLIC",
      userRole: user ? user.role : "CITIZEN",
      ulpin: parcel.ulpin,
      details: `Viewed ownership history and cryptographic status for ${parcel.ulpin}`,
    });

    return NextResponse.json({
      success: true,
      parcel,
      chainStatus: chainVerification,
    });
  } catch (error: any) {
    console.error("GET /api/parcels/[ulpin] error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching parcel details" },
      { status: 500 }
    );
  }
}
