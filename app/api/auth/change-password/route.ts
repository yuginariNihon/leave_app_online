import { NextRequest, NextResponse } from "next/server";
import { requireSessionUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { hashPassword } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSessionUser();

    const body = await request.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || !confirmPassword) {
      return NextResponse.json({ error: "กรุณากรอกรหัสผ่านให้ครบทั้งสองช่อง" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "รหัสผ่านทั้งสองช่องไม่ตรงกัน" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { user_id: session.userId },
      select: { password_hash: true, password_changed_at: true, force_change_password: true },
    });

    if (user?.password_changed_at && !user.force_change_password) {
      const hoursSinceLastChange = (Date.now() - user.password_changed_at.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastChange < 24) {
        const remaining = Math.ceil(24 - hoursSinceLastChange);
        return NextResponse.json(
          { error: `สามารถเปลี่ยนรหัสผ่านได้อีกครั้งในอีก ${remaining} ชั่วโมง` },
          { status: 429 },
        );
      }
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { user_id: session.userId },
      data: { password_hash: passwordHash, force_change_password: false, password_changed_at: new Date() },
    });

    const currentToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

    await prisma.session.deleteMany({
      where: { user_id: session.userId, token: currentToken ? { not: currentToken } : undefined },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/auth/change-password:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
