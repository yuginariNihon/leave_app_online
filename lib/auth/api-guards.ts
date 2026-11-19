import { NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export type GuardResult =
  | { session: SessionUser; error: null }
  | { session: null; error: NextResponse };

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden(): NextResponse {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function requireSession(): Promise<GuardResult> {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return { session: null, error: unauthorized() };
  }
  return { session, error: null };
}

export async function requireAuth(): Promise<GuardResult> {
  return requireSession();
}

/**
 * ต้องมีอย่างน้อยหนึ่ง role ในลิสต์ (เทียบแบบไม่สนตัวพิมพ์เล็ก/ใหญ่).
 * ไม่มี SUPER_ADMIN bypass อัตโนมัติ — route ที่ต้องการให้ SUPER_ADMIN ผ่านต้องระบุเอง
 * เพื่อไม่ให้สิทธิ์หลุดไปยัง route ใหม่โดยไม่ตั้งใจ
 */
export async function requireAnyRole(roles: readonly string[]): Promise<GuardResult> {
  const auth = await requireSession();
  if (auth.error) return auth;
  const allowed = roles.map((role) => role.toUpperCase());
  if (!auth.session.roles.some((role) => allowed.includes(role.toUpperCase()))) {
    return { session: null, error: forbidden() };
  }
  return auth;
}

export async function requireHR(): Promise<GuardResult> {
  const auth = await requireSession();
  if (auth.error) return auth;
  if (!auth.session.roles.includes("SUPER_ADMIN") && !auth.session.roles.includes("HR")) {
    return { session: null, error: forbidden() };
  }
  return auth;
}

export async function requireSuperAdmin(): Promise<GuardResult> {
  const auth = await requireSession();
  if (auth.error) return auth;
  if (!auth.session.roles.includes("SUPER_ADMIN")) {
    return { session: null, error: forbidden() };
  }
  return auth;
}