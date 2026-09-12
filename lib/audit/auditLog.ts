import { prisma } from "@/lib/database/prisma";
import { Prisma } from "@prisma/client";

export interface LogAuditParams {
  userId?: string | null;
  roleSnapshot?: string | null;
  action: string;
  module: string;
  recordId?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

/**
 * Records an immutable audit log entry for system actions and record mutations.
 */
export async function logAuditEvent(params: LogAuditParams) {
  try {
    let validUserId: string | null = null;
    if (params.userId) {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { id: true },
      });
      if (user) {
        validUserId = user.id;
      }
    }

    const entry = await prisma.auditLog.create({
      data: {
        userId: validUserId,
        roleSnapshot: params.roleSnapshot || null,
        action: params.action,
        module: params.module,
        recordId: params.recordId ? String(params.recordId) : null,
        previousValues: (params.previousValues as Prisma.InputJsonValue) || Prisma.JsonNull,
        newValues: (params.newValues as Prisma.InputJsonValue) || Prisma.JsonNull,
        ipAddress: params.ipAddress || null,
      },
    });
    return entry;
  } catch (error) {
    console.error("Failed to write audit log entry:", error);
    return null;
  }
}
