import { prisma } from "@/lib/prisma";
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/errors";

// ────────────────────────────────────
// Role Management
// ────────────────────────────────────

export type RoleItem = {
  roleId: string;
  roleName: string;
  isActive: boolean;
};

export type StaffWithRolesItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  roles: string[];
};

export async function getAllRoles(): Promise<RoleItem[]> {
  const roles = await prisma.role.findMany({
    where: { is_active: true },
    select: { role_id: true, role_name: true, is_active: true },
    orderBy: { role_name: "asc" },
  });
  return roles.map((r) => ({
    roleId: r.role_id,
    roleName: r.role_name,
    isActive: r.is_active,
  }));
}

export async function getStaffRoleList(): Promise<StaffWithRolesItem[]> {
  const staff = await prisma.staffInfo.findMany({
    select: {
      staff_id: true,
      staff_code: true,
      name: true,
      department: { select: { department_name: true } },
      staffRoles: {
        select: { role: { select: { role_name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return staff.map((s) => ({
    staffId: s.staff_id,
    staffCode: s.staff_code,
    name: s.name,
    departmentName: s.department?.department_name ?? null,
    roles: s.staffRoles.map((sr) => sr.role.role_name),
  }));
}

export async function updateStaffRoles(
  staffId: string,
  roleNames: string[],
  currentStaffId: string,
) {
  if (roleNames.length === 0) {
    throw new ValidationError("พนักงานต้องมีบทบาทอย่างน้อย 1 บทบาท");
  }
  if (roleNames.length > 1) {
    throw new ValidationError("พนักงาน 1 คนสามารถมีได้เพียง 1 บทบาท");
  }

  if (staffId === currentStaffId && !roleNames.includes("SUPER_ADMIN")) {
    throw new ForbiddenError("ไม่สามารถถอดสิทธิ์ SUPER_ADMIN ของตัวเองได้");
  }

  if (roleNames.includes("SUPER_ADMIN")) {
    const currentUserRoles = await prisma.staffRole.findMany({
      where: { staff_id: currentStaffId },
      include: { role: { select: { role_name: true } } },
    });
    const isSuperAdmin = currentUserRoles.some((r) => r.role.role_name === "SUPER_ADMIN");
    if (!isSuperAdmin) {
      throw new ForbiddenError("เฉพาะ SUPER_ADMIN เท่านั้นที่สามารถให้สิทธิ์ SUPER_ADMIN ได้");
    }
  }

  const allRoles = await prisma.role.findMany();
  const roles = allRoles.filter((r) =>
    roleNames.some((n) => r.role_name.toUpperCase() === n.toUpperCase())
  );

  if (roles.length === 0) {
    throw new NotFoundError("ไม่พบบทบาทที่ระบุในระบบ");
  }

  await prisma.$transaction(async (tx) => {
    await tx.staffRole.deleteMany({
      where: { staff_id: staffId },
    });

    await tx.staffRole.createMany({
      data: roles.map((r) => ({
        staff_id: staffId,
        role_id: r.role_id,
      })),
    });
  });
}

export type RoleManageItem = {
  roleId: string;
  roleName: string;
  isActive: boolean;
  staffCount: number;
};

const SYSTEM_ROLE_NAMES = ["SUPER_ADMIN", "HR", "APPROVER", "EMPLOYEE"];

export async function getRoleManageList(): Promise<RoleManageItem[]> {
  const roles = await prisma.role.findMany({
    select: {
      role_id: true,
      role_name: true,
      is_active: true,
      _count: { select: { staffRoles: true } },
    },
    orderBy: [{ is_active: "desc" }, { role_name: "asc" }],
  });
  return roles.map((r) => ({
    roleId: r.role_id,
    roleName: r.role_name,
    isActive: r.is_active,
    staffCount: r._count.staffRoles,
  }));
}

export async function createRole(roleName: string) {
  const trimmed = roleName.trim();
  if (!trimmed) throw new ValidationError("กรุณากรอกชื่อ Role");
  const existing = await prisma.role.findFirst({
    where: { role_name: { equals: trimmed, mode: "insensitive" } },
  });
  if (existing) throw new ConflictError("มี Role นี้อยู่ในระบบแล้ว");
  const role = await prisma.role.create({ data: { role_name: trimmed } });
  return { roleId: role.role_id, roleName: role.role_name, isActive: role.is_active };
}

export async function updateRoleName(roleId: string, roleName: string) {
  const role = await prisma.role.findUnique({ where: { role_id: roleId } });
  if (!role) throw new NotFoundError("ไม่พบ Role ในระบบ");
  if (SYSTEM_ROLE_NAMES.includes(role.role_name.toUpperCase())) {
    throw new ValidationError("ไม่สามารถแก้ไข Role ระบบได้");
  }
  const trimmed = roleName.trim();
  if (!trimmed) throw new ValidationError("กรุณากรอกชื่อ Role");
  const duplicate = await prisma.role.findFirst({
    where: { role_name: { equals: trimmed, mode: "insensitive" }, role_id: { not: roleId } },
  });
  if (duplicate) throw new ConflictError("มี Role นี้อยู่ในระบบแล้ว");
  const updated = await prisma.role.update({
    where: { role_id: roleId },
    data: { role_name: trimmed },
  });
  return { roleId: updated.role_id, roleName: updated.role_name, isActive: updated.is_active };
}

export async function toggleRoleActive(roleId: string, isActive: boolean) {
  const role = await prisma.role.findUnique({
    where: { role_id: roleId },
    select: {
      role_id: true,
      role_name: true,
      is_active: true,
      _count: { select: { staffRoles: true } },
    },
  });
  if (!role) throw new NotFoundError("ไม่พบ Role ในระบบ");
  if (SYSTEM_ROLE_NAMES.includes(role.role_name.toUpperCase()) && !isActive) {
    throw new ConflictError("ไม่สามารถปิดใช้งาน Role ระบบได้");
  }
  if (!isActive && role._count.staffRoles > 0) {
    throw new ConflictError("ไม่สามารถปิดใช้งาน Role ที่มีพนักงานใช้งานอยู่ได้");
  }
  const updated = await prisma.role.update({
    where: { role_id: roleId },
    data: { is_active: isActive },
  });
  return { roleId: updated.role_id, roleName: updated.role_name, isActive: updated.is_active };
}
