import { Prisma, EmploymentStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toDateOnly, hashPassword, parseDateOnly } from "@/lib/utils";
import { randomBytes } from "crypto";
import { ConflictError } from "@/lib/errors";

export class StaffUpdateConflictError extends ConflictError {}

export type StaffProfile = {
  name: string;
  staffCode: string;
  positionName: string | null;
  departmentName: string | null;
  employmentTypeName: string | null;
  employmentStatus: string;
};

export async function getStaffProfile(
  staffId: string,
): Promise<StaffProfile | null> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: staffId },
    select: {
      name: true,
      staff_code: true,
      employment_status: true,
      department: { select: { department_name: true } },
      position: { select: { position_name: true } },
      employmentType: { select: { name: true, thainame: true } },
    },
  });

  if (!staff) return null;

  return {
    name: staff.name,
    staffCode: staff.staff_code,
    positionName: staff.position?.position_name ?? null,
    departmentName: staff.department?.department_name ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    employmentStatus: staff.employment_status,
  };
}

// ──────────────────────────────────────────────
// Staff List (HR)
// ──────────────────────────────────────────────

export type StaffListItem = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  positionName: string | null;
  employmentTypeName: string | null;
  employmentStatus: string;
  isActive: boolean;
};

export type StaffListFilters = {
  search?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  limit?: number;
};

export async function getStaffList(
  filters: StaffListFilters,
  isSuperAdmin = false,
): Promise<{ data: StaffListItem[]; total: number; totalPages: number }> {
  const { search, departmentId, status, page = 1, limit = 10 } = filters;

  const where: Prisma.StaffInfoWhereInput = {};

  if (search) {
    where.staff_code = { contains: search, mode: "insensitive" };
  }

  if (departmentId) {
    where.department_id = departmentId;
  }

  if (status === "active") {
    where.is_active = true;
  } else if (status === "inactive") {
    where.is_active = false;
  }

  // Only SUPER_ADMIN can see SUPER_ADMIN users; hide them from everyone else
  if (!isSuperAdmin) {
    where.NOT = {
      staffRoles: {
        some: {
          role: { role_name: "SUPER_ADMIN" },
        },
      },
    };
  }

  const [total, staff] = await Promise.all([
    prisma.staffInfo.count({ where }),
    prisma.staffInfo.findMany({
      where,
      include: {
        department: { select: { department_name: true } },
        position: { select: { position_name: true } },
      employmentType: { select: { name: true, thainame: true } },
      },
      orderBy: [{ is_active: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: staff.map((s) => ({
      staffId: s.staff_id,
      staffCode: s.staff_code,
      name: s.name,
      departmentName: s.department?.department_name ?? null,
      positionName: s.position?.position_name ?? null,
      employmentTypeName: s.employmentType?.thainame ?? s.employmentType?.name ?? null,
      employmentStatus: s.employment_status,
      isActive: s.is_active,
    })),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ──────────────────────────────────────────────
// Staff Master Data & Detail (HR Edit)
// ──────────────────────────────────────────────

export type StaffMasterData = {
  departments: Array<{ id: string; name: string }>;
  positions: Array<{ id: string; name: string }>;
  sections: Array<{ id: string; departmentId: string; name: string }>;
  employmentTypes: Array<{ id: string; name: string; thainame: string | null }>;
};

export type StaffDetailData = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentId: string;
  departmentName: string | null;
  positionId: string;
  positionName: string | null;
  sectionId: string | null;
  sectionName: string | null;
  employmentTypeId: string | null;
  employmentTypeName: string | null;
  phoneNumber: string | null;
  email: string | null;
  dateOfBirth: string | null;
  startDate: string | null;
  employmentStatus: string;
  isActive: boolean;
};

export async function getStaffMasterData(): Promise<StaffMasterData> {
  const [departments, positions, sections, employmentTypes] = await Promise.all([
    prisma.department.findMany({
      where: { is_active: true },
      select: { department_id: true, department_name: true },
      orderBy: { department_name: "asc" },
    }),
    prisma.position.findMany({
      where: { is_active: true },
      select: { position_id: true, position_name: true },
      orderBy: { position_name: "asc" },
    }),
    prisma.section.findMany({
      where: { is_active: true },
      select: { section_id: true, section_name: true, department_id: true },
      orderBy: { section_name: "asc" },
    }),
    prisma.employmentType.findMany({
      where: { is_active: true },
      select: { employment_type_id: true, name: true, thainame: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    departments: departments.map((d) => ({ id: d.department_id, name: d.department_name })),
    positions: positions.map((p) => ({ id: p.position_id, name: p.position_name })),
    sections: sections.map((s) => ({ id: s.section_id, departmentId: s.department_id, name: s.section_name })),
    employmentTypes: employmentTypes.map((e) => ({ id: e.employment_type_id, name: e.name, thainame: e.thainame })),
  };
}

export async function getStaffDetail(id: string): Promise<StaffDetailData | null> {
  const staff = await prisma.staffInfo.findUnique({
    where: { staff_id: id },
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  if (!staff) return null;

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

export async function updateStaff(
  id: string,
  data: {
    name: string;
    departmentId: string;
    positionId: string;
    sectionId?: string | null;
    employmentTypeId?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
    startDate?: string | null;
    employmentStatus?: string;
  },
): Promise<StaffDetailData> {
  const updateData: Prisma.StaffInfoUpdateInput = {
    name: data.name,
    department: { connect: { department_id: data.departmentId } },
    position: { connect: { position_id: data.positionId } },
    updated_at: new Date(),
  };

  if (data.sectionId !== undefined) {
    updateData.section = data.sectionId
      ? { connect: { section_id: data.sectionId } }
      : { disconnect: true };
  }

  if (data.employmentTypeId !== undefined) {
    updateData.employmentType = data.employmentTypeId
      ? { connect: { employment_type_id: data.employmentTypeId } }
      : { disconnect: true };
  }

  if (data.phoneNumber !== undefined) {
    updateData.phoneNumber = data.phoneNumber || null;
  }

  if (data.dateOfBirth !== undefined) {
    updateData.date_of_birth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }

  if (data.startDate !== undefined) {
    updateData.start_date = data.startDate ? new Date(data.startDate) : null;
  }

  if (data.employmentStatus !== undefined) {
    updateData.employment_status = data.employmentStatus as EmploymentStatus;
  }

  const staff = await prisma.staffInfo.update({
    where: { staff_id: id },
    data: updateData,
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  if (data.email !== undefined) {
    const newEmail = data.email?.trim() ?? null;

    // Ensure the email is not already used by another user
    if (newEmail) {
      const emailOwner = await prisma.user.findUnique({
        where: { email: newEmail },
        select: { staff_id: true },
      });
      if (emailOwner && emailOwner.staff_id !== id) {
        throw new StaffUpdateConflictError("อีเมลนี้ถูกใช้งานโดยพนักงานคนอื่นในระบบแล้ว");
      }
    }

    if (staff.user) {
      await prisma.user.update({
        where: { staff_id: id },
        data: { email: newEmail },
      });
    } else if (newEmail) {
      const passwordHash = await hashPassword(staff.phoneNumber || randomBytes(5).toString("hex"));
      await prisma.user.create({
        data: {
          staff_id: id,
          email: newEmail,
          password_hash: passwordHash,
          password_changed_at: new Date(),
        },
      });
    }
  }

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

async function resolveDefaultRole(
  positionId: string,
): Promise<{ role_id: string; role_name: string } | null> {
  const pos = await prisma.position.findUnique({
    where: { position_id: positionId },
    include: {
      defaultRole: { select: { role_id: true, role_name: true, is_active: true } },
    },
  });
  if (!pos?.defaultRole || !pos.defaultRole.is_active) return null;
  return { role_id: pos.defaultRole.role_id, role_name: pos.defaultRole.role_name };
}

export async function createStaff(
  data: {
    staffCode: string;
    name: string;
    departmentId: string;
    positionId: string;
    sectionId?: string | null;
    employmentTypeId?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
    startDate?: string | null;
    employmentStatus?: string;
  },
): Promise<StaffDetailData> {
  const existing = await prisma.staffInfo.findUnique({
    where: { staff_code: data.staffCode },
    select: { staff_id: true },
  });
  if (existing) {
    throw new ConflictError("รหัสพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  const staff = await prisma.staffInfo.create({
    data: {
      staff_code: data.staffCode,
      name: data.name,
      department: { connect: { department_id: data.departmentId } },
      position: { connect: { position_id: data.positionId } },
      section: data.sectionId ? { connect: { section_id: data.sectionId } } : undefined,
      employmentType: data.employmentTypeId ? { connect: { employment_type_id: data.employmentTypeId } } : undefined,
      phoneNumber: data.phoneNumber || null,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      start_date: data.startDate ? new Date(data.startDate) : null,
      employment_status: (data.employmentStatus as EmploymentStatus) ?? "active",
    },
    include: {
      department: { select: { department_id: true, department_name: true } },
      position: { select: { position_id: true, position_name: true } },
      section: { select: { section_id: true, section_name: true } },
      employmentType: { select: { employment_type_id: true, name: true, thainame: true } },
      user: { select: { email: true } },
    },
  });

  const defaultRole = await resolveDefaultRole(data.positionId);
  let staffRole: { role_id: string } | null = defaultRole ? { role_id: defaultRole.role_id } : null;
  if (!staffRole) {
    const posName = staff.position?.position_name?.toLowerCase() || "";
    const isApproverPos = ["general manager", "manager", "senior supervisor", "supervisor", "director"].includes(posName);
    const isEmployeePos = posName === "operator" || posName === "staff";
    const defaultRoleName = isApproverPos ? "APPROVER" : isEmployeePos ? "Employee" : "STAFF";
    staffRole = await prisma.role.findFirst({
      where: { role_name: { equals: defaultRoleName, mode: "insensitive" } },
      select: { role_id: true },
    });
    if (!staffRole) {
      const fallbacks: Record<string, string[]> = {
        APPROVER: ["STAFF", "Employee"],
        Employee: ["STAFF"],
        STAFF: ["Employee"],
      };
      for (const fallback of fallbacks[defaultRoleName] ?? []) {
        staffRole = await prisma.role.findFirst({
          where: { role_name: { equals: fallback, mode: "insensitive" } },
          select: { role_id: true },
        });
        if (staffRole) break;
      }
    }
  }
  if (staffRole) {
    await prisma.staffRole.create({
      data: { staff_id: staff.staff_id, role_id: staffRole.role_id },
    });
  }

  if (data.email) {
    const defaultPassword = data.phoneNumber || randomBytes(5).toString("hex");
    const passwordHash = await hashPassword(defaultPassword);
    await prisma.user.upsert({
      where: { staff_id: staff.staff_id },
      create: {
        staff_id: staff.staff_id,
        email: data.email,
        password_hash: passwordHash,
        password_changed_at: new Date(),
        force_change_password: true,
      },
      update: { email: data.email },
    });
  }

  const activeLeaveTypes = await prisma.leaveType.findMany({
    where: { is_active: true },
    select: { leave_type_id: true, max_days_per_year: true },
  });
  const currentYear = new Date().getFullYear();
  for (const lt of activeLeaveTypes) {
    await prisma.userLeaveLimit.upsert({
      where: {
        staff_id_leave_type_id_year: {
          staff_id: staff.staff_id,
          leave_type_id: lt.leave_type_id,
          year: currentYear,
        },
      },
      create: {
        staff_id: staff.staff_id,
        leave_type_id: lt.leave_type_id,
        year: currentYear,
        max_days: lt.max_days_per_year ?? 0,
        used_days: 0,
      },
      update: {},
    });
  }

  return {
    staffId: staff.staff_id,
    staffCode: staff.staff_code,
    name: staff.name,
    departmentId: staff.department_id,
    departmentName: staff.department?.department_name ?? null,
    positionId: staff.position_id,
    positionName: staff.position?.position_name ?? null,
    sectionId: staff.section_id ?? null,
    sectionName: staff.section?.section_name ?? null,
    employmentTypeId: staff.employment_type_id ?? null,
    employmentTypeName: staff.employmentType?.thainame ?? staff.employmentType?.name ?? null,
    phoneNumber: staff.phoneNumber ?? null,
    email: staff.user?.email ?? null,
    dateOfBirth: staff.date_of_birth ? toDateOnly(staff.date_of_birth).toISOString().split("T")[0] : null,
    startDate: staff.start_date ? toDateOnly(staff.start_date).toISOString().split("T")[0] : null,
    employmentStatus: staff.employment_status,
    isActive: staff.is_active,
  };
}

type ImportRow = {
  staffCode: string;
  name: string;
  departmentName: string;
  positionName: string;
  sectionName?: string | null;
  employmentTypeName?: string | null;
    phoneNumber?: string | null;
    email?: string | null;
    dateOfBirth?: string | null;
  startDate?: string | null;
};

export async function importStaff(
  rows: ImportRow[],
): Promise<{ success: number; errors: { row: number; message: string }[] }> {
  const errors: { row: number; message: string }[] = [];
  let success = 0;

  // Pre-load lookup maps for O(1) case-insensitive matching (avoids N+1 + mode:insensitive)
  const [allDepartments, allPositions, allSections, allEmploymentTypes, allRoles] = await Promise.all([
    prisma.department.findMany({ where: { is_active: true }, select: { department_id: true, department_name: true } }),
    prisma.position.findMany({
      where: { is_active: true },
      select: {
        position_id: true,
        position_name: true,
        defaultRole: { select: { role_id: true, is_active: true } },
      },
    }),
    prisma.section.findMany({ where: { is_active: true }, select: { section_id: true, section_name: true, department_id: true } }),
    prisma.employmentType.findMany({ where: { is_active: true }, select: { employment_type_id: true, name: true } }),
    prisma.role.findMany({ select: { role_id: true, role_name: true } }),
  ]);

  const deptMap = new Map(allDepartments.map((d) => [d.department_name.toLowerCase(), d.department_id]));
  const posMap = new Map(allPositions.map((p) => [p.position_name.toLowerCase(), p.position_id]));
  const sectionMap = new Map(allSections.map((s) => [`${s.department_id}:${s.section_name.toLowerCase()}`, s.section_id]));
  const etMap = new Map(allEmploymentTypes.map((e) => [e.name.toLowerCase(), e.employment_type_id]));
  const roleMap = new Map(allRoles.map((r) => [r.role_name.toUpperCase(), r.role_id]));
  const posDefaultRoleMap = new Map<string, string>();
  for (const p of allPositions) {
    if (p.defaultRole?.is_active) {
      posDefaultRoleMap.set(p.position_name.toLowerCase(), p.defaultRole.role_id);
    }
  }

  await prisma.$transaction(async (tx) => {
    const activeLeaveTypes = await tx.leaveType.findMany({
      where: { is_active: true },
      select: { leave_type_id: true, max_days_per_year: true },
    });
    const currentYear = new Date().getFullYear();

    // Preload existing staff codes once (avoids per-row findUnique duplicate check)
    const existingCodes = await tx.staffInfo.findMany({
      select: { staff_code: true },
    });
    const seenCodes = new Set(existingCodes.map((s) => s.staff_code));

    // Batch accumulators for the pure-bulk per-row writes
    const staffRoleData: { staff_id: string; role_id: string }[] = [];
    const leaveLimitData: {
      staff_id: string;
      leave_type_id: string;
      year: number;
      max_days: number;
      used_days: number;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (seenCodes.has(row.staffCode)) {
          errors.push({ row: i + 1, message: `รหัสพนักงาน ${row.staffCode} มีอยู่ในระบบแล้ว` });
          continue;
        }
        seenCodes.add(row.staffCode);

        const departmentId = deptMap.get(row.departmentName?.toLowerCase() ?? "");
        if (!departmentId) {
          errors.push({ row: i + 1, message: `ไม่พบแผนก ${row.departmentName}` });
          continue;
        }

        const positionId = posMap.get(row.positionName?.toLowerCase() ?? "");
        if (!positionId) {
          errors.push({ row: i + 1, message: `ไม่พบตำแหน่ง ${row.positionName}` });
          continue;
        }

        let sectionId: string | undefined;
        if (row.sectionName) {
          sectionId = sectionMap.get(`${departmentId}:${row.sectionName.toLowerCase()}`);
        }

        let employmentTypeId: string | undefined;
        if (row.employmentTypeName) {
          employmentTypeId = etMap.get(row.employmentTypeName.toLowerCase());
        }

        const dateOfBirth = parseDateOnly(row.dateOfBirth);
        if (row.dateOfBirth && !dateOfBirth) {
          errors.push({ row: i + 1, message: `รูปแบบวันเกิดไม่ถูกต้อง "${row.dateOfBirth}" (ใช้ DD/MM/YYYY หรือ YYYY-MM-DD)` });
          continue;
        }

        const startDate = parseDateOnly(row.startDate);
        if (row.startDate && !startDate) {
          errors.push({ row: i + 1, message: `รูปแบบวันเริ่มงานไม่ถูกต้อง "${row.startDate}" (ใช้ DD/MM/YYYY หรือ YYYY-MM-DD)` });
          continue;
        }

        const createdStaff = await tx.staffInfo.create({
          data: {
            staff_code: row.staffCode,
            name: row.name,
            department_id: departmentId,
            position_id: positionId,
            section_id: sectionId ?? null,
            employment_type_id: employmentTypeId ?? null,
            phoneNumber: row.phoneNumber || null,
            date_of_birth: dateOfBirth,
            start_date: startDate,
            employment_status: "active",
          },
        });

        let roleId = posDefaultRoleMap.get(row.positionName?.toLowerCase() ?? "");
        if (!roleId) {
          const posName = row.positionName?.toLowerCase() || "";
          const isApproverPos = ["general manager", "manager", "senior supervisor", "supervisor", "director"].includes(posName);
          const isEmployeePos = posName === "operator" || posName === "staff";
          const defaultRoleName = isApproverPos ? "APPROVER" : isEmployeePos ? "Employee" : "STAFF";
          const fallbacks: Record<string, string[]> = {
            APPROVER: ["STAFF", "Employee"],
            Employee: ["STAFF"],
            STAFF: ["Employee"],
          };
          roleId = roleMap.get(defaultRoleName.toUpperCase());
          if (!roleId) {
            for (const fallback of fallbacks[defaultRoleName] ?? []) {
              roleId = roleMap.get(fallback.toUpperCase());
              if (roleId) break;
            }
          }
        }
        if (roleId) {
          staffRoleData.push({ staff_id: createdStaff.staff_id, role_id: roleId });
        }

        if (row.email) {
          const defaultPassword = row.phoneNumber || randomBytes(5).toString("hex");
          const passwordHash = await hashPassword(defaultPassword);
          await tx.user.upsert({
            where: { staff_id: createdStaff.staff_id },
            create: {
              staff_id: createdStaff.staff_id,
              email: row.email,
              password_hash: passwordHash,
              password_changed_at: new Date(),
              force_change_password: true,
            },
            update: { email: row.email },
          });
        }

        for (const lt of activeLeaveTypes) {
          leaveLimitData.push({
            staff_id: createdStaff.staff_id,
            leave_type_id: lt.leave_type_id,
            year: currentYear,
            max_days: lt.max_days_per_year ?? 0,
            used_days: 0,
          });
        }

        success++;
      } catch (err) {
        errors.push({ row: i + 1, message: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    // Flush pure-bulk writes in batched createMany calls
    if (staffRoleData.length > 0) {
      await tx.staffRole.createMany({ data: staffRoleData, skipDuplicates: true });
    }
    if (leaveLimitData.length > 0) {
      await tx.userLeaveLimit.createMany({ data: leaveLimitData, skipDuplicates: true });
    }
  });

  return { success, errors };
}
