import { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeDefaultMaxDays,
  getVacationEntitlement,
  isVacationLeaveType,
  loadVacationCarryOverMap,
  yearsOfServiceFrom,
  VACATION_LEAVE_TYPE_NAME,
} from "@/lib/services/leaveQuotaService";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";

export async function syncVacationLeaveLimit(
  staffId: string,
  year: number,
  vacationTypeId: string,
  startDate: Date,
) {
  const yearsOfService = yearsOfServiceFrom(startDate);

  let carryOverDays = 0;
  if (getVacationEntitlement(yearsOfService ?? 0) > 0) {
    const carry = await loadVacationCarryOverMap(prisma, {
      leaveTypeId: vacationTypeId,
      year,
      staffIds: [staffId],
    });
    carryOverDays = carry.get(staffId) ?? 0;
  }

  const maxDays = computeDefaultMaxDays({
    leaveTypeName: VACATION_LEAVE_TYPE_NAME,
    maxDaysPerYear: 0,
    yearsOfService,
    carryOverDays,
  });

  await prisma.userLeaveLimit.upsert({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: vacationTypeId, year } },
    create: { staff_id: staffId, leave_type_id: vacationTypeId, year, max_days: maxDays, used_days: 0 },
    update: { max_days: maxDays, used_days: 0 },
  });
}

export async function syncLeaveLimit(
  staffId: string,
  year: number,
  leaveTypeId: string,
  maxDays: number,
) {
  await prisma.userLeaveLimit.upsert({
    where: { staff_id_leave_type_id_year: { staff_id: staffId, leave_type_id: leaveTypeId, year } },
    create: { staff_id: staffId, leave_type_id: leaveTypeId, year, max_days: maxDays, used_days: 0 },
    update: { max_days: maxDays, used_days: 0 },
  });
}

// ──────────────────────────────────────────────
// Leave limit bulk assign (HR) — ปีปัจจุบันเท่านั้น
// ──────────────────────────────────────────────

export type MissingQuotaStaffItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
};

export type MissingQuotaResult = {
  year: number;
  leaveType: {
    leaveTypeId: string;
    leaveTypeName: string;
    maxDaysPerYear: number | null;
    isPaid: boolean;
    isVacationLeave: boolean;
  };
  totalActiveStaff: number;
  alreadyHave: number;
  missingCount: number;
  missing: MissingQuotaStaffItem[];
};

/** Active staff eligible for a quota (matches the annual-reset cron scope). */
function activeQuotaStaffWhere(excludeSuperAdmin = false): Prisma.StaffInfoWhereInput {
  return {
    is_active: true,
    start_date: { not: null },
    ...(excludeSuperAdmin
      ? { staffRoles: { none: { role: { role_name: "SUPER_ADMIN" } } } }
      : {}),
  };
}

export async function getStaffMissingLeaveLimit(
  leaveTypeId: string,
  year: number = new Date().getFullYear(),
  excludeSuperAdmin = false,
): Promise<MissingQuotaResult> {
  const leaveType = await prisma.leaveType.findUnique({
    where: { leave_type_id: leaveTypeId },
    select: {
      leave_type_id: true,
      leave_type_name: true,
      max_days_per_year: true,
      is_paid: true,
      is_active: true,
    },
  });
  if (!leaveType) {
    throw new NotFoundError("ไม่พบประเภทการลาที่เลือก");
  }
  if (!leaveType.is_active) {
    throw new ConflictError("ไม่สามารถจัดการสิทธิ์ของประเภทการลาที่ปิดใช้งานอยู่ได้");
  }

  const staff = await prisma.staffInfo.findMany({
    where: activeQuotaStaffWhere(excludeSuperAdmin),
    orderBy: { staff_code: "asc" },
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
    },
  });

  const existing = await prisma.userLeaveLimit.findMany({
    where: { leave_type_id: leaveTypeId, year },
    select: { staff_id: true },
  });
  const existingSet = new Set(existing.map((e) => e.staff_id));

  const missing = staff
    .filter((s) => !existingSet.has(s.staff_id))
    .map((s) => ({
      staffId: s.staff_id,
      staffCode: s.staff_code,
      name: s.name,
      departmentName: s.department?.department_name ?? null,
      positionName: s.position?.position_name ?? null,
    }));

  return {
    year,
    leaveType: {
      leaveTypeId: leaveType.leave_type_id,
      leaveTypeName: leaveType.leave_type_name,
      maxDaysPerYear: leaveType.max_days_per_year,
      isPaid: leaveType.is_paid,
      isVacationLeave: isVacationLeaveType(leaveType.leave_type_name),
    },
    totalActiveStaff: staff.length,
    alreadyHave: staff.length - missing.length,
    missingCount: missing.length,
    missing,
  };
}

export type AssignLeaveLimitResult = {
  year: number;
  leaveTypeName: string;
  requested: number;
  created: number;
  skippedDuplicate: number;
  skippedInactive: number;
  skippedSuperAdmin: number;
};

/**
 * Creates UserLeaveLimit rows for the current year only.
 * Never overwrites an existing row (createMany + skipDuplicates), so `used_days` is safe.
 * For annual leave the quota is computed from years of service + carry-over (max 6 days).
 */
export async function assignLeaveLimitToStaff(input: {
  leaveTypeId: string;
  staffIds: string[];
  maxDays: number;
  year?: number;
  excludeSuperAdmin?: boolean;
}): Promise<AssignLeaveLimitResult> {
  const year = input.year ?? new Date().getFullYear();
  let requestedIds = Array.from(new Set(input.staffIds));
  let skippedSuperAdmin = 0;

  // HR must never assign a quota to a SUPER_ADMIN staff — drop them server-side.
  if (input.excludeSuperAdmin && requestedIds.length > 0) {
    const admins = await prisma.staffInfo.findMany({
      where: {
        staff_id: { in: requestedIds },
        staffRoles: { some: { role: { role_name: "SUPER_ADMIN" } } },
      },
      select: { staff_id: true },
    });
    const adminSet = new Set(admins.map((a) => a.staff_id));
    skippedSuperAdmin = requestedIds.filter((id) => adminSet.has(id)).length;
    requestedIds = requestedIds.filter((id) => !adminSet.has(id));
  }

  const leaveType = await prisma.leaveType.findUnique({
    where: { leave_type_id: input.leaveTypeId },
    select: {
      leave_type_id: true,
      leave_type_name: true,
      is_active: true,
      max_days_per_year: true,
    },
  });
  if (!leaveType) {
    throw new NotFoundError("ไม่พบประเภทการลาที่เลือก");
  }
  if (!leaveType.is_active) {
    throw new ConflictError("ไม่สามารถจัดการสิทธิ์ของประเภทการลาที่ปิดใช้งานอยู่ได้");
  }

  const isVacation = isVacationLeaveType(leaveType.leave_type_name);
  if (!isVacation && (input.maxDays < 0 || !Number.isFinite(input.maxDays))) {
    throw new ValidationError("ข้อมูลไม่ถูกต้อง: จำนวนวันลาต้องเป็นตัวเลขที่ไม่ติดลบ");
  }

  const eligible = await prisma.staffInfo.findMany({
    where: { staff_id: { in: requestedIds }, ...activeQuotaStaffWhere() },
    select: { staff_id: true, start_date: true },
  });
  const eligibleMap = new Map(eligible.map((s) => [s.staff_id, s.start_date]));
  const targetIds = eligible.map((s) => s.staff_id);

  const skippedInactive = requestedIds.filter((id) => !eligibleMap.has(id)).length;

  const existing = await prisma.userLeaveLimit.findMany({
    where: { leave_type_id: input.leaveTypeId, year, staff_id: { in: targetIds } },
    select: { staff_id: true },
  });
  const existingSet = new Set(existing.map((e) => e.staff_id));
  const toCreate = targetIds.filter((id) => !existingSet.has(id));
  const skippedDuplicate = targetIds.length - toCreate.length;

  if (toCreate.length === 0) {
    return {
      year,
      leaveTypeName: leaveType.leave_type_name,
      requested: requestedIds.length,
      created: 0,
      skippedDuplicate,
      skippedInactive,
      skippedSuperAdmin,
    };
  }

  // Batch carry-over lookup: one query for all previous-year vacation rows.
  const carryOverMap = isVacation
    ? await loadVacationCarryOverMap(prisma, {
        leaveTypeId: input.leaveTypeId,
        year,
        staffIds: toCreate,
      })
    : new Map<string, number>();

  const rows = toCreate.map((staffId) => {
    const startDate = eligibleMap.get(staffId);
    return {
      staff_id: staffId,
      leave_type_id: input.leaveTypeId,
      year,
      // Annual leave ignores the manual input (seniority formula + carry-over);
      // every other type uses the HR-entered number.
      max_days: computeDefaultMaxDays({
        leaveTypeName: leaveType.leave_type_name,
        maxDaysPerYear: input.maxDays,
        yearsOfService: yearsOfServiceFrom(startDate),
        carryOverDays: carryOverMap.get(staffId) ?? 0,
      }),
      used_days: 0,
    };
  });

  const created = await prisma.userLeaveLimit.createMany({
    data: rows,
    skipDuplicates: true,
  });

  return {
    year,
    leaveTypeName: leaveType.leave_type_name,
    requested: requestedIds.length,
    created: created.count,
    skippedDuplicate,
    skippedInactive,
    skippedSuperAdmin,
  };
}
