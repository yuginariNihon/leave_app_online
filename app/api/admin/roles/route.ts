import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getRoleManageList, createRole } from "@/lib/services/leaveService";
import { seedDefaultPagePermissions } from "@/lib/services/rolePermissionService";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const pageResource = await prisma.pageResource.findUnique({
      where: { page_key: "manage_roles_crud" },
      select: { page_resource_id: true },
    });
    if (!pageResource) {
      await seedDefaultPagePermissions();
    }
    const data = await getRoleManageList();
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (auth.error) return auth.error;

    const body = await request.json();
    const { roleName } = body;
    if (typeof roleName !== "string") {
      return NextResponse.json({ error: "roleName (string) is required" }, { status: 400 });
    }

    const data = await createRole(roleName);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}