import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse, ValidationError } from "@/lib/errors";
import { getStaffMissingLeaveLimit } from "@/lib/services/leaveService";

export const runtime = "nodejs";

const querySchema = z.object({
  leaveTypeId: z.uuid("รูปแบบประเภทการลาไม่ถูกต้อง"),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const parsed = querySchema.safeParse({
      leaveTypeId: request.nextUrl.searchParams.get("leaveTypeId") ?? "",
    });
    if (!parsed.success) {
      throw new ValidationError(`ข้อมูลไม่ถูกต้อง: ${parsed.error.issues[0].message}`);
    }

    const data = await getStaffMissingLeaveLimit(
      parsed.data.leaveTypeId,
      undefined,
      !auth.session?.roles.includes("SUPER_ADMIN"),
    );
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
