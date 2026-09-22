import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/utils";
import { NotFoundError } from "@/lib/errors";

/**
 * Find user by email or employee ID (staff code), including active status and staff details.
 */
export async function findUserByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: identifier, mode: "insensitive" } },
        { staff: { staff_code: { equals: identifier, mode: "insensitive" } } },
      ],
    },
    select: {
      user_id: true,
      email: true,
      password_hash: true,
      is_active: true,
      force_change_password: true,
      staff: {
        select: {
          staff_id: true,
          staff_code: true,
          name: true,
          is_active: true,
        },
      },
    },
  });
}

/**
 * Create a login history audit record.
 */
export async function createLoginHistory(
  userId: string,
  method: string,
  isSuccess: boolean,
  ipAddress?: string,
  userAgent?: string,
) {
  return prisma.loginHistory.create({
    data: {
      user_id: userId,
      login_method: method,
      is_success: isSuccess,
      ip_address: ipAddress?.slice(0, 50) ?? null,
      device_info: userAgent?.slice(0, 500) ?? null,
    },
  });
}

/**
 * Update the last login timestamp for the user.
 */
export async function updateLastLogin(userId: string) {
  return prisma.user.update({
    where: { user_id: userId },
    data: { last_login_at: new Date() },
  });
}

export type UserListItem = {
  userId: string;
  staffId: string;
  email: string | null;
  isActive: boolean;
  forceChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  staffCode: string | null;
  staffName: string | null;
  departmentName: string | null;
  positionName: string | null;
  roleNames: string[];
};

export async function getUserList(params: { search?: string; isActive?: boolean; page?: number; limit?: number; excludeSuperAdmin?: boolean }) {
  const { search, isActive, page = 1, limit = 10, excludeSuperAdmin } = params;
  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.staff = {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { staff_code: { contains: search, mode: "insensitive" } },
      ],
    };
  }
  if (isActive !== undefined) {
    where.is_active = isActive;
  }
  if (excludeSuperAdmin) {
    where.NOT = {
      staff: {
        staffRoles: {
          some: { role: { role_name: "SUPER_ADMIN" } },
        },
      },
    };
  }
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        staff: {
          include: {
            department: { select: { department_name: true } },
            position: { select: { position_name: true } },
            staffRoles: { include: { role: { select: { role_name: true } } } },
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    prisma.user.count({ where }),
  ]);
  const users = rows.map((u) => ({
    userId: u.user_id,
    staffId: u.staff_id,
    email: u.email,
    isActive: u.is_active,
    forceChangePassword: u.force_change_password,
    lastLoginAt: u.last_login_at,
    createdAt: u.created_at,
    staffCode: u.staff?.staff_code ?? null,
    staffName: u.staff?.name ?? null,
    departmentName: u.staff?.department?.department_name ?? null,
    positionName: u.staff?.position?.position_name ?? null,
    roleNames: (u.staff?.staffRoles ?? []).map((r) => r.role?.role_name).filter((n): n is string => Boolean(n)),
  }));
  return {
    users,
    total,
    page,
    limit,
  };
}

export async function getUserById(userId: string) {
  const row = await prisma.user.findUnique({
    where: { user_id: userId },
    include: {
      staff: {
        select: {
          staff_code: true,
          name: true,
          department: { select: { department_name: true } },
          position: { select: { position_name: true } },
          staffRoles: { select: { role: { select: { role_name: true } } } },
        },
      },
    },
  });
  if (!row) return null;
  return {
    userId: row.user_id,
    staffId: row.staff_id,
    email: row.email,
    isActive: row.is_active,
    forceChangePassword: row.force_change_password,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    staffCode: row.staff?.staff_code ?? null,
    staffName: row.staff?.name ?? null,
    departmentName: row.staff?.department?.department_name ?? null,
    positionName: row.staff?.position?.position_name ?? null,
    roleNames: (row.staff?.staffRoles ?? []).map((r) => r.role?.role_name).filter((n): n is string => Boolean(n)),
  };
}

export async function createUserRecord(params: { staffId: string; email: string; password: string }) {
  const passwordHash = await hashPassword(params.password);
  const user = await prisma.user.upsert({
    where: { staff_id: params.staffId },
    update: { email: params.email, password_hash: passwordHash, force_change_password: true, is_active: true, password_changed_at: new Date() },
    create: { staff_id: params.staffId, email: params.email, password_hash: passwordHash, force_change_password: true, is_active: true, password_changed_at: new Date() },
  });
  return user;
}

export async function resetUserPassword(userId: string) {
  const rawPassword = randomBytes(6).toString("hex");
  const passwordHash = await hashPassword(rawPassword);
  await prisma.user.update({
    where: { user_id: userId },
    data: { password_hash: passwordHash, force_change_password: true, password_changed_at: new Date() },
  });
  return { password: rawPassword };
}

export async function toggleUserActive(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { is_active: true },
  });
  if (!existing) throw new NotFoundError("User not found");
  const newValue = !existing.is_active;
  await prisma.user.update({
    where: { user_id: userId },
    data: { is_active: newValue },
  });
  return { isActive: newValue };
}

export async function getStaffRoleNames(staffId: string): Promise<string[]> {
  const roles = await prisma.staffRole.findMany({
    where: { staff_id: staffId },
    select: { role: { select: { role_name: true } } },
  });
  return roles.map((sr) => sr.role.role_name.toUpperCase());
}

export async function getUserRoleNames(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { staff: { select: { staffRoles: { select: { role: { select: { role_name: true } } } } } } },
  });
  return (user?.staff?.staffRoles ?? []).map((sr) => sr.role.role_name.toUpperCase());
}

export async function getUserByStaffId(staffId: string): Promise<{ user_id: string } | null> {
  return prisma.user.findUnique({
    where: { staff_id: staffId },
    select: { user_id: true },
  });
}

export async function getUserLoginHistory(userId: string, limit = 10) {
  const history = await prisma.loginHistory.findMany({
    where: { user_id: userId },
    orderBy: { login_at: "desc" },
    take: limit,
    select: {
      login_history_id: true,
      login_method: true,
      is_success: true,
      login_at: true,
      ip_address: true,
      device_info: true,
    },
  });
  return history.map((h) => ({
    loginHistoryId: h.login_history_id,
    loginMethod: h.login_method,
    isSuccess: h.is_success,
    loginAt: h.login_at,
    ipAddress: h.ip_address,
    deviceInfo: h.device_info,
  }));
}
