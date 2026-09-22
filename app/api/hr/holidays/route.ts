import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getHolidays, createHoliday } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const holidays = await getHolidays();
    return NextResponse.json({ data: holidays });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const body = await request.json();
    if (!body.holidayName || !body.holidayDate) {
      return NextResponse.json(
        { error: "holidayName and holidayDate are required" },
        { status: 400 },
      );
    }

    const holiday = await createHoliday(body);
    return NextResponse.json({ data: holiday }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
