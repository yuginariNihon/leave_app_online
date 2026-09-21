import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const pos = await prisma.position.findUnique({
      where: { position_id: id },
      select: { position_id: true },
    });
    if (!pos) {
      return NextResponse.json({ error: "ไม่พบข้อมูลตำแหน่ง" }, { status: 404 });
    }

    const body = await request.json();
    const defaultRoleId = typeof body.defaultRoleId === "string" && body.defaultRoleId ? body.defaultRoleId : null;

    if (defaultRoleId) {
      const role = await prisma.role.findUnique({
        where: { role_id: defaultRoleId },
        select: { role_id: true, is_active: true },
      });
      if (!role) {
        return NextResponse.json({ error: "ไม่พบบทบาทที่เลือก" }, { status: 400 });
      }
      if (!role.is_active) {
        return NextResponse.json({ error: "ไม่สามารถตั้งบทบาทที่ปิดใช้งานได้" }, { status: 400 });
      }
    }

    await prisma.position.update({
      where: { position_id: id },
      data: { default_role_id: defaultRoleId, updated_at: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PUT /api/admin/positions/[id]/default-role:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }
}