import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateStaffRoles } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isAdmin = session.roles.includes("SUPER_ADMIN") || session.roles.includes("HR");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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

    await updateStaffRoles(id, roles, session.staffId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PATCH /api/hr/roles/staff/[id]:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
