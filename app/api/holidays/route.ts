import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const holidays = await prisma.holiday.findMany({
      select: { holiday_name: true, holiday_date: true },
      orderBy: { holiday_date: "asc" },
    });

    const data = holidays.map((h) => ({
      holidayName: h.holiday_name,
      holidayDate: h.holiday_date.toISOString().split("T")[0],
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/holidays:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
