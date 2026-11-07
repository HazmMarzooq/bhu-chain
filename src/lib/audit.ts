import { prisma } from "./db";

export async function recordAuditLog(payload: {
  action: string;
  performedBy: string;
  userRole: string;
  ulpin?: string;
  details: string;
  ipAddress?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: payload.action,
        performedBy: payload.performedBy,
        userRole: payload.userRole,
        ulpin: payload.ulpin || null,
        details: payload.details,
        ipAddress: payload.ipAddress || "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}
