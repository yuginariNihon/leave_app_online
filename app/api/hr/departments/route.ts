import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getDepartments, createDepartment } from "@/lib/services/leaveService";
import { createDepartmentSchema } from "@/lib/TypeSchema";

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
