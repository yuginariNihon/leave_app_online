import { ApprovalStatus, LeaveStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AUTO_CANCEL_DAYS_DEFAULT,
  autoCancelCutoff,
  autoCancelReason,
  shouldAutoCancel,
} from "@/lib/autoCancel";
import { logger } from "@/lib/logger";
import { invalidateDashboardKpi } from "@/lib/services/dashboardService";
import { scheduleLeaveCancelledEmail } from "@/lib/services/leaveMailerService";

/**
 * ยกเลิกใบลาอัตโนมัติเมื่อ "ค้างอนุมัติขั้นแรกเกิน N วัน"
 *
 * เงื่อนไข (ตรงกับ `shouldAutoCancel` ใน `lib/autoCancel.ts`):
 *   leave_status = pending  ∧  current_approval_level = 1  ∧  created_at < now - N วัน
 *
 * หมายเหตุสำคัญ:
 * - ไม่คืน `used_days` เพราะโควต้าถูกหักตอนอนุมัติครบเท่านั้น (`updateUsedDaysOnApproval`)
 *   ใบที่ยังค้างขั้นแรกจึงไม่เคยถูกหักวัน
 * - ใบที่อนุมัติขั้น 1 แล้วแต่ค้างขั้นถัดไป **ไม่อยู่ในขอบเขต** (current_approval_level > 1)
 * - ทำงานซ้ำได้ปลอดภัย (idempotent) เพราะกรองด้วยสถานะ pending/level 1 ทุกครั้ง
 */

/** จำนวนใบสูงสุดต่อรอบ กัน route timeout */
export const AUTO_CANCEL_BATCH_LIMIT = 200;

/** อ่านจำนวนวันจาก argument → env → ค่าเริ่มต้น (อ่าน env ทุกครั้ง ไม่ cache ตอน import) */
export function resolveAutoCancelDays(override?: number): number {
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.floor(override);
  }
  const fromEnv = Number(process.env.PENDING_AUTO_CANCEL_DAYS);
  return Number.isFinite(fromEnv) && fromEnv > 0
    ? Math.floor(fromEnv)
    : AUTO_CANCEL_DAYS_DEFAULT;
}

export type AutoCancelResult = {
  days: number;
  /** จำนวนใบที่เข้าเงื่อนไข (ก่อนเขียน DB) */
  scanned: number;
  /** จำนวนใบที่ยกเลิกจริง (dryRun = 0) */
  cancelled: number;
  leaveIds: string[];
  dryRun: boolean;
  /** true เมื่อมีใบตกค้างเกิน limit — รอบถัดไปจะเก็บส่วนที่เหลือให้ */
  truncated: boolean;
};

export async function autoCancelStaleLeaves(
  options: { now?: Date; days?: number; dryRun?: boolean; limit?: number } = {},
): Promise<AutoCancelResult> {
  const now = options.now ?? new Date();
  const days = resolveAutoCancelDays(options.days);
  const dryRun = options.dryRun ?? false;
  const limit = options.limit ?? AUTO_CANCEL_BATCH_LIMIT;
  const cutoff = autoCancelCutoff(now, days);

  // กรองหยาบที่ DB (ใช้ index [created_at, leave_status]) แล้วยืนยันด้วย pure predicate
  const candidates = await prisma.dataLeave.findMany({
    where: {
      leave_status: LeaveStatus.pending,
      current_approval_level: 1,
      created_at: { lt: cutoff },
    },
    select: {
      leave_id: true,
      staff_id: true,
      leave_status: true,
      current_approval_level: true,
      created_at: true,
      staff: { select: { user: { select: { user_id: true } } } },
    },
    orderBy: { created_at: "asc" },
    take: limit,
  });

  const stale = candidates.filter((row) =>
    shouldAutoCancel(
      {
        leaveStatus: row.leave_status,
        currentLevel: row.current_approval_level,
        createdAt: row.created_at,
      },
      now,
      days,
    ),
  );

  const leaveIds = stale.map((row) => row.leave_id);
  const truncated = candidates.length >= limit;

  if (leaveIds.length === 0 || dryRun) {
    if (truncated) {
      logger.warn("leave/autoCancel", `Candidate list hit the ${limit}-row limit.`, {
        days,
        truncated,
      });
    }
    return {
      days,
      scanned: stale.length,
      cancelled: 0,
      leaveIds,
      dryRun,
      truncated,
    };
  }

  const cancelled: string[] = [];

  await prisma.$transaction(async (tx) => {
    // ตรวจซ้ำใน transaction: ใบที่เพิ่งถูกอนุมัติ/ยกเลิกไปแล้วระหว่างทางจะถูกข้าม
    const stillStale = await tx.dataLeave.findMany({
      where: {
        leave_id: { in: leaveIds },
        leave_status: LeaveStatus.pending,
        current_approval_level: 1,
      },
      select: { leave_id: true },
    });

    const ids = stillStale.map((row) => row.leave_id);
    if (ids.length === 0) return;

    await tx.dataLeave.updateMany({
      where: { leave_id: { in: ids } },
      data: {
        leave_status: LeaveStatus.cancelled,
        cancelled_at: now,
        cancel_reason: autoCancelReason(days),
        updated_at: now,
      },
    });

    // เหมือน `cancelLeaveRequest`: ปิดทุกขั้นที่ยัง pending
    await tx.leaveApproval.updateMany({
      where: { leave_id: { in: ids }, approval_status: ApprovalStatus.pending },
      data: { approval_status: ApprovalStatus.cancelled, acted_at: now },
    });

    cancelled.push(...ids);
  });

  // Audit trail — `AuditLog.user_id` เป็น NOT NULL จึงใช้ user ของเจ้าของใบลา
  // และแยกด้วย action = "auto_cancel" (ระบบเป็นผู้ทำ ไม่ใช่เจ้าของ)
  const cancelledSet = new Set(cancelled);
  const auditRows = stale.flatMap((row) => {
    const userId = row.staff.user?.user_id;
    if (!userId || !cancelledSet.has(row.leave_id)) return [];
    return [
      {
        user_id: userId,
        staff_id: row.staff_id,
        action: "auto_cancel",
        target_type: "leave",
        target_id: row.leave_id,
      },
    ];
  });

  if (auditRows.length > 0) {
    try {
      await prisma.auditLog.createMany({ data: auditRows });
    } catch (error) {
      // audit ล้มเหลวไม่ควรทำให้การยกเลิกที่ commit แล้วเสียเปล่า
      logger.warn("leave/autoCancel", "Failed to write audit log.", {
        error: error instanceof Error ? error.message : String(error),
        count: auditRows.length,
      });
    }
  }

  invalidateDashboardKpi();
  for (const leaveId of cancelled) {
    scheduleLeaveCancelledEmail(leaveId);
  }

  logger.info("leave/autoCancel", `Auto-cancelled ${cancelled.length} stale leave(s).`, {
    days,
    scanned: stale.length,
    cancelled: cancelled.length,
    truncated,
  });

  return {
    days,
    scanned: stale.length,
    cancelled: cancelled.length,
    leaveIds: cancelled,
    dryRun,
    truncated,
  };
}
