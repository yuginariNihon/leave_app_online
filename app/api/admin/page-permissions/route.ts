import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getPagePermissions, updatePagePermission, seedDefaultPagePermissions } from "@/lib/services/rolePermissionService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    await seedDefaultPagePermissions();
    const data = await getPagePermissions();
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

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
    return apiErrorResponse(error);
  }
}
