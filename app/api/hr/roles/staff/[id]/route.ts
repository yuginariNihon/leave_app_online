import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getStaffRoleNames, updateStaffRoles } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { session, error } = await requireHR();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { roles } = body;

    if (!Array.isArray(roles)) {
      return NextResponse.json({ error: "roles (string[]) is required" }, { status: 400 });
    }

    // HR cannot assign HR or SUPER_ADMIN role to anyone (including themselves)
    const isHR = session.roles.includes("HR") && !session.roles.includes("SUPER_ADMIN");
    const wantsElevated = roles.some((r) => r.toUpperCase() === "HR" || r.toUpperCase() === "SUPER_ADMIN");
    if (isHR && wantsElevated) {
      return NextResponse.json({ error: "HR ไม่สามารถเพิ่มสิทธิ์ HR หรือ SUPER_ADMIN ให้กับผู้ใช้ได้" }, { status: 403 });
    }

    // HR cannot modify roles of an existing SUPER_ADMIN or HR account
    if (isHR) {
      const targetRoles = await getStaffRoleNames(id);
      const isTargetAdminOrHR = targetRoles.includes("SUPER_ADMIN") || targetRoles.includes("HR");
      if (isTargetAdminOrHR) {
        return NextResponse.json({ error: "HR ไม่ได้รับอนุญาตให้แก้ไขบทบาทสิทธิ์ของระดับบริหารอื่น" }, { status: 403 });
      }
    }

    await updateStaffRoles(id, roles, session.staffId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
