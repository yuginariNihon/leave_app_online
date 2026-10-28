import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
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

    const input = await parseBody(request, createEmploymentTypeSchema);
    const et = await createEmploymentType(input);
    return NextResponse.json({ data: et }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
