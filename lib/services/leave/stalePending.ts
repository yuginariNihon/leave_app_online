import { ApprovalStatus, LeaveStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AUTO_CANCEL_DAYS_DEFAULT,
  autoCancelCutoff,
  autoCancelReason,
  isStalePending,
  waitingDays,
  waitingSinceOf,
  shouldAutoCancel,
} from "@/lib/autoCancel";
import { timeFromDb } from "@/lib/utils";
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

// ──────────────────────────────────────
// รายการเตือน (READ-ONLY) — ใบที่ค้างอนุมัติเกิน N วัน ทุกขั้น
// ไม่มีการเขียน DB ใด ๆ ทั้งสิ้น
// ──────────────────────────────────────

/** จำนวนแถวที่แสดงบน dashboard */
export const STALE_PENDING_LIMIT = 5;

/**
 * จำนวนแถวสูงสุดที่กวาดจาก DB ต่อครั้ง
 * (กรอง `created_at` หยาบที่ DB แล้วค่อยคัดด้วย `isStalePending` ใน JS
 *  จึงต้องเผื่อจำนวนมากกว่าที่จะแสดง)
 */
export const STALE_PENDING_SCAN_LIMIT = 200;

export type StalePendingItem = {
  leaveId: string;
  leaveNo: string | null;
  staffName: string;
  departmentName: string | null;
  leaveTypeName: string;
  caseName: string;
  /** ขั้นที่กำลังรออยู่ (1 = ยังไม่มีใครอนุมัติเลย) */
  currentLevel: number;
  /** วันที่เข้าสู่ขั้นปัจจุบัน (ISO) */
  waitingSince: string;
  /** จำนวนวันที่ค้าง ณ ตอนคำนวณ */
  waitingDays: number;
  startDate: string;
  endDate: string;
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: number | null;
  totalDays: number;
};

export type StalePendingListResult = {
  /** เกณฑ์ที่ใช้ (วัน) — ตัวเดียวกับ cron */
  days: number;
  items: StalePendingItem[];
  /** true เมื่อมีใบตกค้างมากกว่าจำนวนที่แสดง */
  hasMore: boolean;
};

/**
 * ดึงใบลาที่ "ค้างอนุมัติเกิน N วัน" เพื่อแสดงเป็นการ์ดเตือนบน dashboard HR
 *
 * จุดเริ่มนับ: `acted_at` ของขั้นที่อนุมัติล่าสุด ?? `created_at`
 * → ใบที่อนุมัติขั้น 1–2 แล้วแต่เพิ่งเข้าขั้น 3 เมื่อ 5 วัน จะไม่ถูกเตือน
 *   (ถึงแม้จะยื่นใบมานานแล้ว) — ต่างจาก `autoCancelStaleLeaves` ที่ดูเฉพาะ
 *   ใบขั้นแรกและนับจาก `created_at` (ซึ่งเท่ากันเพราะยังไม่มีใครอนุมัติ)
 *
 * กรองหยาบที่ DB ด้วย `created_at < cutoff` ได้อย่างปลอดภัย เพราะ
 * `waitingSince >= created_at` เสมอ → ไม่มีใบที่ควรเตือนถูกตัดออก
 */
export async function getStalePendingLeaves(
  options: { now?: Date; days?: number; limit?: number } = {},
): Promise<StalePendingListResult> {
  const now = options.now ?? new Date();
  const days = resolveAutoCancelDays(options.days);
  const limit = options.limit ?? STALE_PENDING_LIMIT;
  const cutoff = autoCancelCutoff(now, days);

  const rows = await prisma.dataLeave.findMany({
    where: {
      leave_status: LeaveStatus.pending,
      created_at: { lt: cutoff },
    },
    select: {
      leave_id: true,
      leave_no: true,
      leave_status: true,
      created_at: true,
      current_approval_level: true,
      start_date: true,
      end_date: true,
      leave_mode: true,
      start_time: true,
      end_time: true,
      hours: true,
      total_days: true,
      staff: {
        select: {
          name: true,
          department: { select: { department_name: true } },
        },
      },
      leaveType: { select: { leave_type_name: true } },
      leaveCase: { select: { case_name: true } },
      approvals: {
        where: { approval_status: ApprovalStatus.approved, acted_at: { not: null } },
        select: { acted_at: true },
        orderBy: { approval_level: "desc" },
        take: 1,
      },
    },
    orderBy: { created_at: "asc" },
    take: STALE_PENDING_SCAN_LIMIT,
  });

  const items: StalePendingItem[] = rows
    .flatMap((row) => {
      const lastApprovedAt = row.approvals[0]?.acted_at ?? null;
      const state = {
        leaveStatus: row.leave_status,
        createdAt: row.created_at,
        lastApprovedAt,
      };
      if (!isStalePending(state, now, days)) return [];

      const waitingSince = waitingSinceOf(state);

      return [
        {
          leaveId: row.leave_id,
          leaveNo: row.leave_no,
          staffName: row.staff.name,
          departmentName: row.staff.department?.department_name ?? null,
          leaveTypeName: row.leaveType.leave_type_name,
          caseName: row.leaveCase.case_name,
          currentLevel: row.current_approval_level,
          waitingSince: waitingSince.toISOString(),
          waitingDays: waitingDays(waitingSince, now),
          startDate: row.start_date?.toISOString().split("T")[0] ?? "",
          endDate: row.end_date?.toISOString().split("T")[0] ?? "",
          leaveMode: row.leave_mode ?? "day",
          startTime: row.start_time ? timeFromDb(row.start_time) : null,
          endTime: row.end_time ? timeFromDb(row.end_time) : null,
          hours: row.hours != null ? Number(row.hours) : null,
          totalDays: Number(row.total_days ?? 0),
        },
      ];
    })
    .sort((a, b) => b.waitingDays - a.waitingDays);

  return {
    days,
    items: items.slice(0, limit),
    hasMore: items.length > limit,
  };
}
