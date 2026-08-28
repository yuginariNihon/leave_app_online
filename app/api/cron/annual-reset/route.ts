import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVacationEntitlement } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const year = new Date().getFullYear();
  const prevYear = year - 1;

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

  const vacationType = leaveTypes.find((l) => l.leave_type_name === "พักร้อน");
  const prevVacation = vacationType
    ? await prisma.userLeaveLimit.findMany({
        where: { year: prevYear, leave_type_id: vacationType.leave_type_id },
        select: { staff_id: true, max_days: true, used_days: true },
      })
    : [];
  const prevVacationMap = new Map(
    prevVacation.map((l) => [l.staff_id, l]),
  );

  // Compute all desired (max_days) values in memory
  const targets: { staffId: string; leaveTypeId: string; maxDays: number }[] = [];
  let vacation = 0;
  let other = 0;
  for (const staff of staffList) {
    for (const lt of leaveTypes) {
      let maxDays: number;
      if (vacationType && lt.leave_type_id === vacationType.leave_type_id) {
        const yearsOfService = Math.floor((Date.now() - staff.start_date!.getTime()) / (365.25 * 86400000));
        const entitlement = getVacationEntitlement(yearsOfService);
        let carry = 0;
        if (entitlement > 0) {
          const prev = prevVacationMap.get(staff.staff_id);
          if (prev) {
            const unused = Math.max(0, Number(prev.max_days) - Number(prev.used_days));
            carry = Math.min(unused, 6);
          }
        }
        maxDays = entitlement + carry;
        vacation++;
      } else {
        maxDays = lt.max_days_per_year ?? 0;
        other++;
      }
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
            return tx.userLeaveLimit.updateMany({
              where: {
                staff_id: t.staffId,
                leave_type_id: t.leaveTypeId,
                year,
              },
              data: { max_days: t.maxDays, used_days: 0 },
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
