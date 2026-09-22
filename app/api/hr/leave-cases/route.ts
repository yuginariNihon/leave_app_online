import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
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

    const body = await request.json();
    const parsed = createLeaveCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const c = await createLeaveCase(parsed.data);
    return NextResponse.json({ data: c }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
