import { prisma } from "@/lib/prisma";

export function logReadAccess(
  userId: string,
  staffId: string,
  targetType: string,
  targetId?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  prisma.auditLog.create({
    data: {
      user_id: userId,
      staff_id: staffId,
      action: "read",
      target_type: targetType,
      target_id: targetId?.slice(0, 100) ?? null,
      ip_address: ipAddress?.slice(0, 50) ?? null,
      user_agent: userAgent?.slice(0, 500) ?? null,
    },
  }).catch(() => {});
}
