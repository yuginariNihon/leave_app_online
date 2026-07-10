import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStaffRoleList } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isAdmin = session.roles.includes("SUPER_ADMIN") || session.roles.includes("HR");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const staff = await getStaffRoleList();
    return NextResponse.json({ data: staff });
  } catch (error) {
    console.error("Error in GET /api/hr/roles/staff-list:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
