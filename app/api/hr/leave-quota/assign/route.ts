import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse, ValidationError } from "@/lib/errors";
import { leaveQuotaAssignSchema } from "@/lib/TypeSchema";
import { assignLeaveLimitToStaff } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const parsed = leaveQuotaAssignSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(`ข้อมูลไม่ถูกต้อง: ${parsed.error.issues[0].message}`);
    }

    const data = await assignLeaveLimitToStaff({
      ...parsed.data,
      excludeSuperAdmin: !auth.session?.roles.includes("SUPER_ADMIN"),
    });
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
