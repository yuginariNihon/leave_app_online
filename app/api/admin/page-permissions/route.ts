import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPagePermissions, updatePagePermission, seedDefaultPagePermissions } from "@/lib/services/rolePermissionService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await seedDefaultPagePermissions();
    const data = await getPagePermissions();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/admin/page-permissions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { permissions } = body;

    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: "permissions (array) is required" }, { status: 400 });
    }

    for (const perm of permissions) {
      if (!perm.pageResourceId || !Array.isArray(perm.roleIds)) {
        return NextResponse.json({ error: "Invalid permission entry" }, { status: 400 });
      }
      await updatePagePermission(perm.pageResourceId, perm.roleIds);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in PUT /api/admin/page-permissions:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
