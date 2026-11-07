import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [
      totalParcels,
      cleanParcels,
      encumberedParcels,
      disputedParcels,
      totalBlocks,
      totalAuditLogs,
      pendingRequests,
    ] = await Promise.all([
      prisma.parcel.count(),
      prisma.parcel.count({ where: { status: "APPROVED", encumbranceStatus: "NONE", disputeStatus: "NONE" } }),
      prisma.parcel.count({ where: { encumbranceStatus: "MORTGAGED" } }),
      prisma.parcel.count({ where: { disputeStatus: "ACTIVE_DISPUTE" } }),
      prisma.blockchainEvent.count(),
      prisma.auditLog.count(),
      prisma.workflowRequest.count({ where: { status: { in: ["PENDING_REGISTRAR", "PENDING_REVENUE"] } } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalParcels,
        cleanParcels,
        encumberedParcels,
        disputedParcels,
        totalBlocks,
        totalAuditLogs,
        pendingRequests,
      },
    });
  } catch (error: any) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform statistics" },
      { status: 500 }
    );
  }
}
