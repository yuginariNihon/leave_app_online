import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeDefaultMaxDays,
  isVacationLeaveType,
  loadVacationCarryOverMap,
  yearsOfServiceFrom,
} from "@/lib/services/leaveQuotaService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = new Date().getFullYear();

  const staffList = await prisma.staffInfo.findMany({
    where: { is_active: true, start_date: { not: null } },
    select: { staff_id: true, start_date: true },
  });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { is_active: true },
    select: { leave_type_id: true, leave_type_name: true, max_days_per_year: true },
  });

  // Preload existing limits for the target year + prev-year vacation limits (for carry-over)
  const currentYear = await prisma.userLeaveLimit.findMany({
    where: { year },
    select: { staff_id: true, leave_type_id: true },
  });
  const currentSet = new Set(
    currentYear.map((l) => `${l.staff_id}::${l.leave_type_id}`),
  );

  const vacationType = leaveTypes.find((l) => isVacationLeaveType(l.leave_type_name));
  const vacationCarryOver = vacationType
    ? await loadVacationCarryOverMap(prisma, {
        leaveTypeId: vacationType.leave_type_id,
        year,
        staffIds: staffList.map((s) => s.staff_id),
      })
    : new Map<string, number>();

  // Compute all desired (max_days) values in memory
  const targets: { staffId: string; leaveTypeId: string; maxDays: number }[] = [];
  let vacation = 0;
  let other = 0;
  for (const staff of staffList) {
    for (const lt of leaveTypes) {
      const maxDays = computeDefaultMaxDays({
        leaveTypeName: lt.leave_type_name,
        maxDaysPerYear: lt.max_days_per_year,
        yearsOfService: yearsOfServiceFrom(staff.start_date),
        carryOverDays: vacationCarryOver.get(staff.staff_id) ?? 0,
      });
      if (vacationType && lt.leave_type_id === vacationType.leave_type_id) vacation++;
      else other++;
      targets.push({ staffId: staff.staff_id, leaveTypeId: lt.leave_type_id, maxDays });
    }
  }

  // Batch upsert in parallel chunks inside a single transaction
  const CHUNK = 50;
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < targets.length; i += CHUNK) {
      const chunk = targets.slice(i, i + CHUNK);
      await Promise.all(
        chunk.map((t) => {
          const key = `${t.staffId}::${t.leaveTypeId}`;
          if (currentSet.has(key)) {
            // Row already exists for the target year — refresh only max_days.
            // Do NOT reset used_days here: if this job re-runs mid-year it would
            // wipe approvals already consumed against the current quota.
            return tx.userLeaveLimit.updateMany({
              where: {
                staff_id: t.staffId,
                leave_type_id: t.leaveTypeId,
                year,
              },
              data: { max_days: t.maxDays },
            });
          }
          return tx.userLeaveLimit.create({
            data: {
              staff_id: t.staffId,
              leave_type_id: t.leaveTypeId,
              year,
              max_days: t.maxDays,
              used_days: 0,
            },
          });
        }),
      );
    }
  });

  return NextResponse.json({ synced: { vacation, other } });
}
