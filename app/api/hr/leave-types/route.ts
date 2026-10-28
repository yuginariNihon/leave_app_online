import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getLeaveTypes, createLeaveType } from "@/lib/services/leaveService";
import { createLeaveTypeSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const leaveTypes = await getLeaveTypes();
    return NextResponse.json({ data: leaveTypes });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createLeaveTypeSchema);
    const lt = await createLeaveType(input);
    return NextResponse.json({ data: lt }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
