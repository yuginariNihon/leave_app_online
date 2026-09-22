import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getEmploymentTypes, createEmploymentType } from "@/lib/services/leaveService";
import { createEmploymentTypeSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const employeeTypes = await getEmploymentTypes();
    return NextResponse.json({ data: employeeTypes });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createEmploymentTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const et = await createEmploymentType(parsed.data);
    return NextResponse.json({ data: et }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
