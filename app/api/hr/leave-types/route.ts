import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
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

    const body = await request.json();
    const parsed = createLeaveTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const lt = await createLeaveType(parsed.data);
    return NextResponse.json({ data: lt }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
