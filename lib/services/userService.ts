import { prisma } from "@/lib/prisma";

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
export async function createLoginHistory(userId: string, method: string, isSuccess: boolean) {
  return prisma.loginHistory.create({
    data: {
      user_id: userId,
      login_method: method,
      is_success: isSuccess,
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
