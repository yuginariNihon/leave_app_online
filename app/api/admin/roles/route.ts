import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getRoleManageList, createRole } from "@/lib/services/leaveService";
import { seedDefaultPagePermissions } from "@/lib/services/rolePermissionService";
import { prisma } from "@/lib/prisma";

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
    console.error("Error in GET /api/admin/roles:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { roleName } = body;
    if (typeof roleName !== "string") {
      return NextResponse.json({ error: "roleName (string) is required" }, { status: 400 });
    }

    const data = await createRole(roleName);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/admin/roles:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}