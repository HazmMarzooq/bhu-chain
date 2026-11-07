import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const ulpin = searchParams.get("ulpin");
    const eventType = searchParams.get("eventType");

    const where: any = {};
    if (ulpin) where.ulpin = ulpin.trim().toUpperCase();
    if (eventType && eventType !== "ALL") where.eventType = eventType;

    const events = await prisma.blockchainEvent.findMany({
      where,
      orderBy: { approvalTimestamp: "desc" },
      take: limit,
      include: {
        parcel: {
          select: {
            district: true,
            village: true,
            ownerName: true,
            status: true,
          },
        },
      },
    });

    const totalEvents = await prisma.blockchainEvent.count();

    return NextResponse.json({
      success: true,
      totalEvents,
      events,
    });
  } catch (error: any) {
    console.error("GET /api/blockchain/events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch blockchain events" },
      { status: 500 }
    );
  }
}
