import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getLeaveCases, createLeaveCase } from "@/lib/services/leaveService";
import { createLeaveCaseSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const leaveCases = await getLeaveCases();
    return NextResponse.json({ data: leaveCases });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createLeaveCaseSchema);
    const c = await createLeaveCase(input);
    return NextResponse.json({ data: c }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
