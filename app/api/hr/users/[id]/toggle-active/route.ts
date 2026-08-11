import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser } from "@/lib/auth";
import { toggleUserActive, getUserRoleNames } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSessionUser();
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    // HR cannot toggle the active status of a SUPER_ADMIN or HR account
    if (!session.roles.includes("SUPER_ADMIN")) {
      const targetRoles = await getUserRoleNames(id);
      const isTargetAdminOrHR = targetRoles.includes("SUPER_ADMIN") || targetRoles.includes("HR");
      if (isTargetAdminOrHR) {
        return NextResponse.json({ error: "ไม่สามารถสลับสถานะการใช้งานของบัญชีระดับบริหารอื่น" }, { status: 403 });
      }
    }

    const result = await toggleUserActive(id);

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Error in PATCH /api/hr/users/[id]/toggle-active:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
