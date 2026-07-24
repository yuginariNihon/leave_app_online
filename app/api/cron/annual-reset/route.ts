import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncVacationLeaveLimit, syncLeaveLimit } from "@/lib/services/leaveService";

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

  let vacation = 0;
  let other = 0;

  for (const staff of staffList) {
    for (const lt of leaveTypes) {
      if (lt.leave_type_name === "พักร้อน") {
        await syncVacationLeaveLimit(staff.staff_id, year, lt.leave_type_id, staff.start_date!);
        vacation++;
      } else {
        await syncLeaveLimit(staff.staff_id, year, lt.leave_type_id, lt.max_days_per_year ?? 0);
        other++;
      }
    }
  }

  return NextResponse.json({ synced: { vacation, other } });
}
