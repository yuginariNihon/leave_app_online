import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/auth/api-guards";
import { apiErrorResponse } from "@/lib/core/errors";
import { parseBody } from "@/lib/core/http";
import { getDepartments, createDepartment } from "@/lib/services/leaveService";
import { createDepartmentSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const departments = await getDepartments();
    return NextResponse.json({ data: departments });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createDepartmentSchema);
    const dept = await createDepartment(input);
    return NextResponse.json({ data: dept }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
