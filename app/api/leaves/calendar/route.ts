import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = session.roles.some((r) => ["HR", "SUPER_ADMIN", "APPROVER"].includes(r.toUpperCase()));
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const monthParam = searchParams.get("month");
    const year = monthParam ? Number(monthParam.split("-")[0]) : new Date().getFullYear();
    const month = monthParam ? Number(monthParam.split("-")[1]) - 1 : new Date().getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    const [rows, holidayRows] = await Promise.all([
      prisma.$queryRaw<{
        start_date: Date; end_date: Date;
        staff_id: string; staff_name: string;
        department_name: string;
        leave_type_name: string;
      }[]>`
        SELECT dl.start_date, dl.end_date,
               s.staff_id, s.name AS staff_name,
               d.department_name,
               lt.leave_type_name
        FROM "DataLeave" dl
        JOIN "StaffInfo" s ON s.staff_id = dl.staff_id
        JOIN "Department" d ON d.department_id = s.department_id
        JOIN "LeaveType" lt ON lt.leave_type_id = dl.leave_type_id
        WHERE dl.leave_status = 'approved'
          AND dl.start_date <= ${monthEnd}::date
          AND dl.end_date >= ${monthStart}::date
        ORDER BY dl.start_date ASC
      `,
      prisma.$queryRaw<{ holiday_name: string; holiday_date: Date; is_recurring: boolean }[]>`
        SELECT holiday_name, holiday_date, is_recurring
        FROM "Holiday"
        WHERE EXTRACT(MONTH FROM holiday_date) = ${month + 1}
          AND (EXTRACT(YEAR FROM holiday_date) = ${year} OR is_recurring = true)
        ORDER BY EXTRACT(DAY FROM holiday_date) ASC
      `,
    ]);

    const pad = (n: number) => String(n).padStart(2, "0");
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Build holiday map: holiday_date string → holiday_name
    const holidayMap = new Map<string, string>();
    for (const h of holidayRows) {
      const hYear = h.is_recurring ? year : h.holiday_date.getFullYear();
      const dateStr = `${hYear}-${pad(h.holiday_date.getMonth() + 1)}-${pad(h.holiday_date.getDate())}`;
      holidayMap.set(dateStr, h.holiday_name);
    }

    const days: {
      date: string; isToday: boolean; count: number;
      leaves: { staffName: string; leaveTypeName: string; departmentName: string }[];
      holidayName: string | null;
    }[] = [];

    function toLocalDateStr(d: Date): string {
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
      const isToday = dateStr === todayStr;

      const dayLeaves = rows
        .filter((r) => {
          const start = toLocalDateStr(r.start_date);
          const end = toLocalDateStr(r.end_date);
          return dateStr >= start && dateStr <= end;
        })
        .map((r) => ({
          staffName: r.staff_name,
          leaveTypeName: r.leave_type_name,
          departmentName: r.department_name,
        }));

      days.push({
        date: dateStr,
        isToday,
        count: dayLeaves.length,
        leaves: dayLeaves,
        holidayName: holidayMap.get(dateStr) ?? null,
      });
    }

    return NextResponse.json({ days, month: monthParam || `${year}-${String(month + 1).padStart(2, "0")}` });
  } catch (error) {
    console.error("Error in GET /api/leaves/calendar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
