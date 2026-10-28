import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse, ValidationError } from "@/lib/errors";
import { readJson } from "@/lib/http";
import { updateHoliday, deleteHoliday } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await readJson<{ holidayName?: string; holidayDate?: string; isRecurring?: boolean }>(request);
    if (!body.holidayName || !body.holidayDate) {
      throw new ValidationError("holidayName and holidayDate are required");
    }

    const holiday = await updateHoliday(id, {
      holidayName: body.holidayName,
      holidayDate: body.holidayDate,
      isRecurring: body.isRecurring,
    });
    return NextResponse.json({ data: holiday });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    await deleteHoliday(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
