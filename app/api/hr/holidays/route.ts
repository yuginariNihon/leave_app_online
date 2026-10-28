import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse, ValidationError } from "@/lib/errors";
import { readJson } from "@/lib/http";
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

    const body = await readJson<{ holidayName?: string; holidayDate?: string; isRecurring?: boolean }>(request);
    if (!body.holidayName || !body.holidayDate) {
      throw new ValidationError("holidayName and holidayDate are required");
    }

    const holiday = await createHoliday({
      holidayName: body.holidayName,
      holidayDate: body.holidayDate,
      isRecurring: body.isRecurring,
    });
    return NextResponse.json({ data: holiday }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
