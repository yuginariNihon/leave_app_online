import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────
// Leave quota defaults — SINGLE SOURCE OF TRUTH
// ──────────────────────────────────────────────
// Every place that needs the "default max_days" of a (staff, leaveType, year)
// must use computeDefaultMaxDays() / resolveDefaultMaxDays() instead of
// re-deriving `LeaveType.max_days_per_year ?? 0` inline:
//   • approval path (upsert when a row is missing — auto-provision)
//   • createStaff / importStaff (row per active leave type)
//   • annual-reset cron (vacation formula + carry-over)
//   • HR leave-quota assign page
// This module is a leaf service: it must never import the leaveService /
// approvalService hubs (they import it) or the graph cycles.

/** Name of the annual-leave type — single source of truth across services. */
export const VACATION_LEAVE_TYPE_NAME = "พักร้อน";

/** Maximum unused days carried over from the previous year (annual leave). */
export const VACATION_CARRY_OVER_CAP_DAYS = 6;

const MS_PER_YEAR = 365.25 * 86_400_000;

/** Client or transaction handle — mirrors the pattern used by approvalService. */
export type QuotaDb =
  | typeof prisma
  | Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

/** Single source of truth for "is this the annual-leave type?" */
export function isVacationLeaveType(leaveTypeName: string | null | undefined): boolean {
  return leaveTypeName === VACATION_LEAVE_TYPE_NAME;
}

/** Whole years of service, or null when the staff has no start date. */
export function yearsOfServiceFrom(startDate: Date | null | undefined): number | null {
  if (!startDate) return null;
  return Math.floor((Date.now() - startDate.getTime()) / MS_PER_YEAR);
}

/** Annual-leave entitlement by seniority (0 / 6 / 8 / 10 days). */
export function getVacationEntitlement(yearsOfService: number): number {
  if (yearsOfService < 1) return 0;
  if (yearsOfService <= 3) return 6;
  if (yearsOfService <= 6) return 8;
  return 10;
}

export type DefaultQuotaInput = {
  leaveTypeName: string | null | undefined;
  /** LeaveType.max_days_per_year (ignored for annual leave) */
  maxDaysPerYear: number | null | undefined;
  yearsOfService: number | null | undefined;
  /** Unused days from the previous year — annual leave only, capped at 6 */
  carryOverDays?: number | null;
};

/**
 * Default `max_days` for a staff + leave type + year.
 * Annual leave → seniority formula + carry-over; every other type → the
 * leave type's own annual default.
 */
export function computeDefaultMaxDays(input: DefaultQuotaInput): number {
  if (isVacationLeaveType(input.leaveTypeName)) {
    const carry = Math.min(
      Math.max(0, Number(input.carryOverDays ?? 0)),
      VACATION_CARRY_OVER_CAP_DAYS,
    );
    return getVacationEntitlement(input.yearsOfService ?? 0) + carry;
  }
  return Number(input.maxDaysPerYear ?? 0);
}

/** true when the leave type has no annual default configured → quota stays 0. */
export function isUnconfiguredLeaveType(input: {
  leaveTypeName: string | null | undefined;
  maxDaysPerYear: number | null | undefined;
}): boolean {
  return !isVacationLeaveType(input.leaveTypeName) && input.maxDaysPerYear == null;
}

/** Unused previous-year days per staff, used as annual-leave carry-over. */
export async function loadVacationCarryOverMap(
  db: QuotaDb,
  args: { leaveTypeId: string; year: number; staffIds?: string[] },
): Promise<Map<string, number>> {
  if (args.staffIds && args.staffIds.length === 0) return new Map();
  const rows = await db.userLeaveLimit.findMany({
    where: {
      leave_type_id: args.leaveTypeId,
      year: args.year - 1,
      ...(args.staffIds ? { staff_id: { in: args.staffIds } } : {}),
    },
    select: { staff_id: true, max_days: true, used_days: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    const unused = Math.max(0, Number(row.max_days) - Number(row.used_days));
    map.set(row.staff_id, Math.min(unused, VACATION_CARRY_OVER_CAP_DAYS));
  }
  return map;
}

export type ResolvedDefaultQuota = {
  maxDays: number;
  /** leaveType = per-type default, vacationFormula = seniority + carry-over */
  source: "leaveType" | "vacationFormula" | "unconfigured";
};

/**
 * Resolves the default quota for one staff + leave type + year, including the
 * annual-leave carry-over lookup. Used by the approval path when the
 * UserLeaveLimit row does not exist yet (auto-provision instead of silently
 * skipping the cap check).
 */
export async function resolveDefaultMaxDays(
  db: QuotaDb,
  args: {
    staffId: string;
    leaveTypeId: string;
    year: number;
    /** Skip these queries when the caller already has the values. */
    startDate?: Date | null;
    leaveTypeName?: string | null;
    maxDaysPerYear?: number | null;
  },
): Promise<ResolvedDefaultQuota> {
  let { leaveTypeName, maxDaysPerYear } = args;

  if (leaveTypeName === undefined || maxDaysPerYear === undefined) {
    const leaveType = await db.leaveType.findUnique({
      where: { leave_type_id: args.leaveTypeId },
      select: { leave_type_name: true, max_days_per_year: true },
    });
    leaveTypeName = leaveType?.leave_type_name ?? null;
    maxDaysPerYear = leaveType?.max_days_per_year ?? null;
  }

  let carryOverDays = 0;
  let startDate = args.startDate;
  if (isVacationLeaveType(leaveTypeName)) {
    if (startDate === undefined) {
      const staff = await db.staffInfo.findUnique({
        where: { staff_id: args.staffId },
        select: { start_date: true },
      });
      startDate = staff?.start_date ?? null;
    }
    const carry = await loadVacationCarryOverMap(db, {
      leaveTypeId: args.leaveTypeId,
      year: args.year,
      staffIds: [args.staffId],
    });
    carryOverDays = carry.get(args.staffId) ?? 0;
  }

  const unconfigured = isUnconfiguredLeaveType({ leaveTypeName, maxDaysPerYear });
  return {
    maxDays: computeDefaultMaxDays({
      leaveTypeName,
      maxDaysPerYear,
      // use the resolved `startDate` — args.startDate may still be undefined here
      yearsOfService: yearsOfServiceFrom(startDate),
      carryOverDays,
    }),
    source: unconfigured
      ? "unconfigured"
      : isVacationLeaveType(leaveTypeName)
        ? "vacationFormula"
        : "leaveType",
  };
}

/** Active leave types this staff has NO quota row for (drives the UI notice). */
export async function getUnassignedLeaveTypeIds(
  staffId: string,
  year: number = new Date().getFullYear(),
): Promise<string[]> {
  const [types, assigned] = await Promise.all([
    prisma.leaveType.findMany({
      where: { is_active: true },
      select: { leave_type_id: true },
    }),
    prisma.userLeaveLimit.findMany({
      where: { staff_id: staffId, year },
      select: { leave_type_id: true },
    }),
  ]);
  const assignedSet = new Set(assigned.map((a) => a.leave_type_id));
  return types.map((t) => t.leave_type_id).filter((id) => !assignedSet.has(id));
}