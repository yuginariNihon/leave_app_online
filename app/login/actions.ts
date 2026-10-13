"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createSession, deleteSession } from "@/lib/auth";
import { LOGIN_NEXT_COOKIE } from "@/lib/loginNextCookie";
import { prisma } from "@/lib/prisma";
import {
  findUserByIdentifier,
  createLoginHistory,
  updateLastLogin,
} from "@/lib/services/userService";

export type LoginState = {
  message?: string;
};

const RATE_LIMIT_DELAY_MS = 30_000;

/**
 * The `next` cookie is untrusted input (anyone can write a cookie for the
 * domain). Only a path under /dashboard is ever accepted — this closes the
 * open-redirect vector (external URLs, protocol-relative //evil.com, etc.).
 */
function safeNextPath(raw: string | undefined): string | null {
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!decoded.startsWith("/dashboard")) return null;
  if (decoded.includes("//") || /[\\\r\n]/.test(decoded)) return null;
  if (/^[a-z]+:/i.test(decoded)) return null;
  return decoded;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0].trim() || undefined;
  const userAgent = headersList.get("user-agent") || undefined;

  // Read the remembered destination once and always clear it — a stale value
  // must never leak into a later login attempt.
  const cookieStore = await cookies();
  const nextRaw = cookieStore.get(LOGIN_NEXT_COOKIE)?.value;
  cookieStore.delete(LOGIN_NEXT_COOKIE);
  const nextPath = safeNextPath(nextRaw);

  if (!identifier || !password) {
    return { message: "Please enter your employee ID/email and password." };
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // Group 1: Parallel — IP rate limit + user lookup
  const [ipFailures, user] = await Promise.all([
    ipAddress
      ? prisma.loginHistory.count({
          where: {
            ip_address: ipAddress,
            is_success: false,
            login_at: { gte: fiveMinutesAgo },
          },
        })
      : Promise.resolve(0),
    findUserByIdentifier(identifier),
  ]);

  if (ipFailures >= 10) {
    await sleep(RATE_LIMIT_DELAY_MS);
    return { message: "Invalid login credentials." };
  }

  if (!user?.password_hash || !user.is_active || !user.staff?.is_active) {
    return { message: "Invalid login credentials." };
  }

  // Group 2: user failure check
  const recentFailures = await prisma.loginHistory.count({
    where: {
      user_id: user.user_id,
      is_success: false,
      login_at: { gte: fiveMinutesAgo },
    },
  });

  if (recentFailures >= 5) {
    await sleep(RATE_LIMIT_DELAY_MS);
    return { message: "Invalid login credentials." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    await createLoginHistory(user.user_id, "password", false, ipAddress, userAgent);
    return { message: "Invalid login credentials." };
  }

  // Group 3: Parallel — writes + role lookup
  const [staffRoles] = await Promise.all([
    prisma.staffRole.findMany({
      where: { staff_id: user.staff.staff_id },
      include: { role: { select: { role_name: true } } },
    }),
    createLoginHistory(user.user_id, "password", true, ipAddress, userAgent),
    updateLastLogin(user.user_id),
  ]);

  const isHR = staffRoles.some((r) => r.role.role_name === "HR" || r.role.role_name === "SUPER_ADMIN");

  await createSession({
    userId: user.user_id,
    staffId: user.staff.staff_id,
    staffCode: user.staff.staff_code,
    name: user.staff.name,
    email: user.email ?? "",
    roles: staffRoles.map((sr) => sr.role.role_name),
    forceChangePassword: user.force_change_password,
  });

  if (user.force_change_password) {
    redirect("/dashboard/reset-password?force=true");
  }

  redirect(nextPath ?? (isHR ? "/dashboard/hr" : "/dashboard"));
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
