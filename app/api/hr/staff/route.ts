import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { createStaff } from "@/lib/services/leaveService";
import { createStaffSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createStaffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const staff = await createStaff(parsed.data);
    return NextResponse.json({ data: staff }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
