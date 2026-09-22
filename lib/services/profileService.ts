import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/utils";

// ──────────────────────────────────────────────
// Self-Service Profile (Employee)
// ──────────────────────────────────────────────

export type StaffProfileData = {
  staffId: string;
  staffCode: string;
  name: string;
  phoneNumber: string | null;
  email: string | null;
  departmentName: string | null;
  positionName: string | null;
};

export async function getMyProfile(staffId: string): Promise<StaffProfileData | null> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      phoneNumber: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
      user: { select: { email: true } },
    },
  });

  if (!staff) return null;

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    departmentName: staff.department?.department_name ?? null,
    positionName: staff.position?.position_name ?? null,
  };
}

export async function updateMyProfile(
  staffId: string,
  data: { name: string; phoneNumber?: string | null; email?: string | null },
): Promise<StaffProfileData> {
  const staff = await prisma.staffInfo.update({
    where: { staff_id: staffId },
    data: {
      name: data.name,
      phoneNumber: data.phoneNumber ?? null,
      updated_at: new Date(),
    },
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      phoneNumber: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
      user: { select: { email: true } },
    },
  });

  if (data.email !== undefined) {
    if (staff.user) {
      await prisma.user.update({
        where: { staff_id: staffId },
        data: { email: data.email || null },
      });
    } else if (data.email) {
      const { randomBytes } = await import("crypto");
      const passwordHash = await hashPassword(staff.phoneNumber || randomBytes(5).toString("hex"));
      await prisma.user.create({
        data: {
          staff_id: staffId,
          email: data.email,
          password_hash: passwordHash,
        },
      });
    }
  }

  // Re-fetch after user update to get fresh email
  const updated = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      phoneNumber: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
      user: { select: { email: true } },
    },
  });

  return {
    staffId: updated!.staff_id,
    staffCode: updated!.staff_code,
    name: updated!.name,
    phoneNumber: updated!.phoneNumber ?? null,
    email: updated!.user?.email ?? null,
    departmentName: updated!.department?.department_name ?? null,
    positionName: updated!.position?.position_name ?? null,
  };
}
