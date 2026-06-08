import { prisma } from "@/lib/prisma";

type CreateAuditLogParams = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
};

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: CreateAuditLogParams) {
  await prisma.auditLog.create({
    data: {
      userId: userId || null,
      action,
      entity,
      entityId: entityId || null,
      details: details || null,
    },
  });
}