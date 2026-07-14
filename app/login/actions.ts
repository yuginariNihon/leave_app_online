"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, deleteSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findUserByIdentifier,
  createLoginHistory,
  updateLastLogin,
} from "@/lib/services/userService";

export type LoginState = {
  message?: string;
};

export async function loginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { message: "Please enter your employee ID/email and password." };
  }

  const user = await findUserByIdentifier(identifier);

  if (user) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentFailures = await prisma.loginHistory.count({
      where: {
        user_id: user.user_id,
        is_success: false,
        login_at: { gte: fiveMinutesAgo },
      },
    });

    if (recentFailures >= 5) {
      const lastFailure = await prisma.loginHistory.findFirst({
        where: {
          user_id: user.user_id,
          is_success: false,
        },
        orderBy: { login_at: "desc" },
        select: { login_at: true },
      });

      if (lastFailure && Date.now() - lastFailure.login_at.getTime() < 3600000) {
        return { message: "Invalid login credentials." };
      }
    }
  }

  if (!user?.password_hash || !user.is_active || !user.staff?.is_active) {
    return { message: "Invalid login credentials." };
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  await createLoginHistory(user.user_id, "password", passwordMatches);

  if (!passwordMatches) {
    return { message: "Invalid login credentials." };
  }

  await updateLastLogin(user.user_id);

  const staffRoles = await prisma.staffRole.findMany({
    where: { staff_id: user.staff.staff_id },
    include: { role: { select: { role_name: true } } },
  });

  const isHR = staffRoles.some((r) => r.role.role_name === "HR" || r.role.role_name === "SUPER_ADMIN");

  await createSession({
    userId: user.user_id,
    staffId: user.staff.staff_id,
    staffCode: user.staff.staff_code,
    name: user.staff.name,
    email: user.email ?? "",
    roles: staffRoles.map((sr) => sr.role.role_name),
  });

  if (user.force_change_password) {
    redirect("/dashboard/reset-password?force=true");
  }

  redirect(isHR ? "/dashboard/hr" : "/dashboard");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/login");
}
