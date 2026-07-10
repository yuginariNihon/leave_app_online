import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ allowed: false }, { status: 401 });
    }

    if (session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ allowed: true });
    }

    const { pageKey } = await request.json();
    if (typeof pageKey !== "string") {
      return NextResponse.json({ allowed: false }, { status: 400 });
    }

    const resource = await prisma.pageResource.findUnique({
      where: { page_key: pageKey },
      select: {
        rolePermissions: {
          select: { role: { select: { role_name: true } } },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ allowed: false });
    }

    const allowedRoleNames = resource.rolePermissions.map((rp) => rp.role.role_name);
    const hasAccess = allowedRoleNames.some((role) =>
      session.roles.some((r) => r.toUpperCase() === role.toUpperCase())
    );

    return NextResponse.json({ allowed: hasAccess });
  } catch (error) {
    console.error("Error in check-page-access:", error);
    return NextResponse.json({ allowed: false }, { status: 500 });
  }
}
