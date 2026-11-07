import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== "AUDITOR" && user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Auditor or Admin role required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const action = searchParams.get("action");

    const where: any = {};
    if (action && action !== "ALL") where.action = { contains: action };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    const totalLogs = await prisma.auditLog.count();

    return NextResponse.json({
      success: true,
      totalLogs,
      logs,
    });
  } catch (error: any) {
    console.error("GET /api/audit-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
