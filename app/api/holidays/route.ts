import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}
