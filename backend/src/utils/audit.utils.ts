import { prisma } from "../config/database";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any> | string | null;
  ipAddress?: string | null;
}

export async function logAudit({
  userId,
  action,
  entity,
  entityId,
  details,
  ipAddress
}: LogAuditParams): Promise<void> {
  try {
    const detailsStr =
      details && typeof details === "object"
        ? JSON.stringify(details)
        : details || null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        details: detailsStr,
        ipAddress: ipAddress || null
      }
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

