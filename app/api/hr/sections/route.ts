import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getSections, createSection } from "@/lib/services/leaveService";
import { createSectionSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("department_id") || undefined;

    const sections = await getSections(departmentId);
    return NextResponse.json({ data: sections });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createSectionSchema);
    const section = await createSection(input);
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
