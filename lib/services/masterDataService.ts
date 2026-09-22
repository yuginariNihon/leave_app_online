import { prisma } from "@/lib/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";

// ────────────────────────────────────
// Department CRUD
// ────────────────────────────────────

export type DepartmentListItem = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  isActive: boolean;
  sectionCount: number;
  staffCount: number;
};

export async function getDepartments(): Promise<DepartmentListItem[]> {
  const departments = await prisma.department.findMany({
    orderBy: { department_name: "asc" },
    include: {
      _count: { select: { sections: true, staffs: true } },
    },
  });

  return departments.map((d) => ({
    departmentId: d.department_id,
    departmentCode: d.department_code,
    departmentName: d.department_name,
    isActive: d.is_active,
    sectionCount: d._count.sections,
    staffCount: d._count.staffs,
  }));
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { department_id: id },
    include: {
      _count: { select: { sections: true, staffs: true } },
    },
  });
  if (!dept) return null;
  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
    sectionCount: dept._count.sections,
    staffCount: dept._count.staffs,
  };
}

export async function createDepartment(data: {
  departmentCode: string;
  departmentName: string;
}) {
  const existing = await prisma.department.findUnique({
    where: { department_code: data.departmentCode },
    select: { department_id: true },
  });
  if (existing) {
    throw new ConflictError("รหัสแผนกนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.create({
    data: {
      department_code: data.departmentCode,
      department_name: data.departmentName,
    },
  });

  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
  };
}

export async function updateDepartment(
  id: string,
  data: {
    departmentCode: string;
    departmentName: string;
  },
) {
  const existing = await prisma.department.findFirst({
    where: {
      department_code: data.departmentCode,
      department_id: { not: id },
    },
    select: { department_id: true },
  });
  if (existing) {
    throw new ConflictError("รหัสแผนกนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.update({
    where: { department_id: id },
    data: {
      department_code: data.departmentCode,
      department_name: data.departmentName,
      updated_at: new Date(),
    },
  });

  return {
    departmentId: dept.department_id,
    departmentCode: dept.department_code,
    departmentName: dept.department_name,
    isActive: dept.is_active,
  };
}

export async function toggleDepartmentActive(id: string, isActive: boolean) {
  const dept = await prisma.department.findUnique({
    where: { department_id: id },
    select: { department_id: true },
  });
  if (!dept) {
    throw new NotFoundError("ไม่พบแผนก");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { department_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new ConflictError("ไม่สามารถปิดแผนกได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่ในแผนกนี้");
    }
  }

  await prisma.department.update({
    where: { department_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// Position CRUD
// ────────────────────────────────────

export type PositionListItem = {
  positionId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  staffCount: number;
  defaultRoleId: string | null;
  defaultRoleName: string | null;
};

export async function getPositions(): Promise<PositionListItem[]> {
  const positions = await prisma.position.findMany({
    orderBy: { position_name: "asc" },
    include: {
      _count: { select: { staffs: true } },
      defaultRole: { select: { role_id: true, role_name: true } },
    },
  });

  return positions.map((p) => ({
    positionId: p.position_id,
    positionName: p.position_name,
    positionLevel: p.position_level,
    isActive: p.is_active,
    staffCount: p._count.staffs,
    defaultRoleId: p.defaultRole?.role_id ?? null,
    defaultRoleName: p.defaultRole?.role_name ?? null,
  }));
}

export async function getPositionById(id: string) {
  const pos = await prisma.position.findUnique({
    where: { position_id: id },
    include: {
      _count: { select: { staffs: true } },
    },
  });
  if (!pos) return null;
  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
    staffCount: pos._count.staffs,
  };
}

export async function createPosition(data: {
  positionName: string;
  positionLevel?: number | null;
}) {
  const existing = await prisma.position.findUnique({
    where: { position_name: data.positionName },
    select: { position_id: true },
  });
  if (existing) {
    throw new ConflictError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว");
  }

  const pos = await prisma.position.create({
    data: {
      position_name: data.positionName,
      position_level: data.positionLevel ?? null,
    },
  });

  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
  };
}

export async function updatePosition(
  id: string,
  data: {
    positionName: string;
    positionLevel?: number | null;
  },
) {
  const existing = await prisma.position.findFirst({
    where: {
      position_name: data.positionName,
      position_id: { not: id },
    },
    select: { position_id: true },
  });
  if (existing) {
    throw new ConflictError("ชื่อตำแหน่งนี้มีอยู่ในระบบแล้ว");
  }

  const pos = await prisma.position.update({
    where: { position_id: id },
    data: {
      position_name: data.positionName,
      position_level: data.positionLevel ?? null,
      updated_at: new Date(),
    },
  });

  return {
    positionId: pos.position_id,
    positionName: pos.position_name,
    positionLevel: pos.position_level,
    isActive: pos.is_active,
  };
}

export async function togglePositionActive(id: string, isActive: boolean) {
  const pos = await prisma.position.findUnique({
    where: { position_id: id },
    select: { position_id: true },
  });
  if (!pos) {
    throw new NotFoundError("ไม่พบตำแหน่ง");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { position_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new ConflictError("ไม่สามารถปิดตำแหน่งได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่ในตำแหน่งนี้");
    }
  }

  await prisma.position.update({
    where: { position_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// Section CRUD
// ────────────────────────────────────

export type SectionListItem = {
  sectionId: string;
  sectionCode: string;
  sectionName: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
};

export async function getSections(departmentId?: string): Promise<SectionListItem[]> {
  const where: Record<string, unknown> = {};
  if (departmentId) {
    where.department_id = departmentId;
  }

  const sections = await prisma.section.findMany({
    where,
    orderBy: { section_name: "asc" },
    include: {
      department: { select: { department_name: true } },
    },
  });

  return sections.map((s) => ({
    sectionId: s.section_id,
    sectionCode: s.section_code,
    sectionName: s.section_name,
    departmentId: s.department_id,
    departmentName: s.department.department_name,
    isActive: s.is_active,
  }));
}

export async function getSectionById(id: string) {
  const section = await prisma.section.findUnique({
    where: { section_id: id },
    include: {
      department: { select: { department_id: true, department_name: true } },
    },
  });
  if (!section) return null;
  return {
    sectionId: section.section_id,
    sectionCode: section.section_code,
    sectionName: section.section_name,
    departmentId: section.department_id,
    departmentName: section.department.department_name,
    isActive: section.is_active,
  };
}

export async function createSection(data: {
  sectionCode: string;
  sectionName: string;
  departmentId: string;
}) {
  const existing = await prisma.section.findUnique({
    where: { section_code: data.sectionCode },
    select: { section_id: true },
  });
  if (existing) {
    throw new ConflictError("รหัสส่วนงานนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.findUnique({
    where: { department_id: data.departmentId },
    select: { department_id: true },
  });
  if (!dept) {
    throw new NotFoundError("ไม่พบแผนกที่เลือก");
  }

  const section = await prisma.section.create({
    data: {
      section_code: data.sectionCode,
      section_name: data.sectionName,
      department_id: data.departmentId,
    },
  });

  return {
    sectionId: section.section_id,
    sectionCode: section.section_code,
    sectionName: section.section_name,
    departmentId: section.department_id,
    isActive: section.is_active,
  };
}

export async function updateSection(
  id: string,
  data: {
    sectionCode: string;
    sectionName: string;
    departmentId: string;
  },
) {
  const existing = await prisma.section.findFirst({
    where: {
      section_code: data.sectionCode,
      section_id: { not: id },
    },
    select: { section_id: true },
  });
  if (existing) {
    throw new ConflictError("รหัสส่วนงานนี้มีอยู่ในระบบแล้ว");
  }

  const dept = await prisma.department.findUnique({
    where: { department_id: data.departmentId },
    select: { department_id: true },
  });
  if (!dept) {
    throw new NotFoundError("ไม่พบแผนกที่เลือก");
  }

  const section = await prisma.section.update({
    where: { section_id: id },
    data: {
      section_code: data.sectionCode,
      section_name: data.sectionName,
      department_id: data.departmentId,
      updated_at: new Date(),
    },
  });

  return {
    sectionId: section.section_id,
    sectionCode: section.section_code,
    sectionName: section.section_name,
    departmentId: section.department_id,
    isActive: section.is_active,
  };
}

export async function toggleSectionActive(id: string, isActive: boolean) {
  const section = await prisma.section.findUnique({
    where: { section_id: id },
    select: { section_id: true },
  });
  if (!section) {
    throw new NotFoundError("ไม่พบส่วนงาน");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { section_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new ConflictError("ไม่สามารถปิดส่วนงานได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่ในส่วนงานนี้");
    }
  }

  await prisma.section.update({
    where: { section_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// LeaveType CRUD
// ────────────────────────────────────

export type LeaveTypeListItem = {
  leaveTypeId: string;
  leaveTypeName: string;
  maxDaysPerYear: number | null;
  isPaid: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
  leaveCaseCount: number;
  leaveCount: number;
};

export async function getLeaveTypes(): Promise<LeaveTypeListItem[]> {
  const types = await prisma.leaveType.findMany({
    orderBy: { leave_type_name: "asc" },
    include: {
      _count: { select: { leaveCases: true, leaves: true } },
    },
  });

  return types.map((t) => ({
    leaveTypeId: t.leave_type_id,
    leaveTypeName: t.leave_type_name,
    maxDaysPerYear: t.max_days_per_year,
    isPaid: t.is_paid,
    requiresAttachment: t.requires_attachment,
    isActive: t.is_active,
    leaveCaseCount: t._count.leaveCases,
    leaveCount: t._count.leaves,
  }));
}

export async function getLeaveTypeById(id: string) {
  const lt = await prisma.leaveType.findUnique({
    where: { leave_type_id: id },
    include: {
      _count: { select: { leaveCases: true, leaves: true } },
    },
  });
  if (!lt) return null;
  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
    leaveCaseCount: lt._count.leaveCases,
    leaveCount: lt._count.leaves,
  };
}

export async function createLeaveType(data: {
  leaveTypeName: string;
  maxDaysPerYear?: number | null;
  isPaid?: boolean;
  requiresAttachment?: boolean;
}) {
  const existing = await prisma.leaveType.findUnique({
    where: { leave_type_name: data.leaveTypeName },
    select: { leave_type_id: true },
  });
  if (existing) {
    throw new ConflictError("ชื่อประเภทการลานี้มีอยู่ในระบบแล้ว");
  }

  const lt = await prisma.leaveType.create({
    data: {
      leave_type_name: data.leaveTypeName,
      max_days_per_year: data.maxDaysPerYear ?? null,
      is_paid: data.isPaid ?? true,
      requires_attachment: data.requiresAttachment ?? false,
    },
  });

  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
  };
}

export async function updateLeaveType(
  id: string,
  data: {
    leaveTypeName: string;
    maxDaysPerYear?: number | null;
    isPaid?: boolean;
    requiresAttachment?: boolean;
  },
) {
  const existing = await prisma.leaveType.findFirst({
    where: {
      leave_type_name: data.leaveTypeName,
      leave_type_id: { not: id },
    },
    select: { leave_type_id: true },
  });
  if (existing) {
    throw new ConflictError("ชื่อประเภทการลานี้มีอยู่ในระบบแล้ว");
  }

  const lt = await prisma.leaveType.update({
    where: { leave_type_id: id },
    data: {
      leave_type_name: data.leaveTypeName,
      max_days_per_year: data.maxDaysPerYear ?? null,
      is_paid: data.isPaid ?? true,
      requires_attachment: data.requiresAttachment ?? false,
      updated_at: new Date(),
    },
  });

  return {
    leaveTypeId: lt.leave_type_id,
    leaveTypeName: lt.leave_type_name,
    maxDaysPerYear: lt.max_days_per_year,
    isPaid: lt.is_paid,
    requiresAttachment: lt.requires_attachment,
    isActive: lt.is_active,
  };
}

export async function toggleLeaveTypeActive(id: string, isActive: boolean) {
  const lt = await prisma.leaveType.findUnique({
    where: { leave_type_id: id },
    select: { leave_type_id: true },
  });
  if (!lt) {
    throw new NotFoundError("ไม่พบประเภทการลา");
  }

  if (!isActive) {
    const caseCount = await prisma.leaveCase.count({
      where: { leave_type_id: id, is_active: true },
    });
    if (caseCount > 0) {
      throw new ConflictError("ไม่สามารถปิดประเภทการลาได้ เนื่องจากยังมีกรณีการลาที่ใช้งานอยู่");
    }
  }

  await prisma.leaveType.update({
    where: { leave_type_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// LeaveCase CRUD
// ────────────────────────────────────

export type LeaveCaseListItem = {
  leaveCaseId: string;
  caseName: string;
  leaveTypeId: string;
  leaveTypeName: string;
  isActive: boolean;
  leaveCount: number;
};

export async function getLeaveCases(): Promise<LeaveCaseListItem[]> {
  const cases = await prisma.leaveCase.findMany({
    orderBy: [{ leave_type_id: "asc" }, { case_name: "asc" }],
    include: {
      leaveType: { select: { leave_type_name: true } },
      _count: { select: { leaves: true } },
    },
  });

  return cases.map((c) => ({
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    leaveTypeName: c.leaveType.leave_type_name,
    isActive: c.is_active,
    leaveCount: c._count.leaves,
  }));
}

export async function getLeaveCaseById(id: string) {
  const c = await prisma.leaveCase.findUnique({
    where: { leave_case_id: id },
    include: {
      leaveType: { select: { leave_type_name: true } },
      _count: { select: { leaves: true } },
    },
  });
  if (!c) return null;
  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    leaveTypeName: c.leaveType.leave_type_name,
    isActive: c.is_active,
    leaveCount: c._count.leaves,
  };
}

export async function createLeaveCase(data: {
  leaveTypeId: string;
  caseName: string;
}) {
  const existing = await prisma.leaveCase.findUnique({
    where: { leave_type_id_case_name: { leave_type_id: data.leaveTypeId, case_name: data.caseName } },
    select: { leave_case_id: true },
  });
  if (existing) {
    throw new ConflictError("กรณีการลานี้มีอยู่ในระบบแล้วสำหรับประเภทการลาที่เลือก");
  }

  const c = await prisma.leaveCase.create({
    data: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
    },
  });

  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    isActive: c.is_active,
  };
}

export async function updateLeaveCase(
  id: string,
  data: {
    leaveTypeId: string;
    caseName: string;
  },
) {
  const existing = await prisma.leaveCase.findFirst({
    where: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
      leave_case_id: { not: id },
    },
    select: { leave_case_id: true },
  });
  if (existing) {
    throw new ConflictError("กรณีการลานี้มีอยู่ในระบบแล้วสำหรับประเภทการลาที่เลือก");
  }

  const c = await prisma.leaveCase.update({
    where: { leave_case_id: id },
    data: {
      leave_type_id: data.leaveTypeId,
      case_name: data.caseName,
      updated_at: new Date(),
    },
  });

  return {
    leaveCaseId: c.leave_case_id,
    caseName: c.case_name,
    leaveTypeId: c.leave_type_id,
    isActive: c.is_active,
  };
}

export async function toggleLeaveCaseActive(id: string, isActive: boolean) {
  const c = await prisma.leaveCase.findUnique({
    where: { leave_case_id: id },
    select: { leave_case_id: true },
  });
  if (!c) {
    throw new NotFoundError("ไม่พบกรณีการลา");
  }

  if (!isActive) {
    const leaveCount = await prisma.dataLeave.count({
      where: { leave_case_id: id },
    });
    if (leaveCount > 0) {
      throw new ConflictError("ไม่สามารถปิดกรณีการลาได้ เนื่องจากมีใบลาที่ใช้งานอยู่");
    }
  }

  await prisma.leaveCase.update({
    where: { leave_case_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// ────────────────────────────────────
// EmploymentType CRUD
// ────────────────────────────────────

export type EmploymentTypeListItem = {
  employmentTypeId: string;
  code: string;
  name: string;
  thainame: string | null;
  description: string | null;
  isActive: boolean;
  staffCount: number;
};

export async function getEmploymentTypes(): Promise<EmploymentTypeListItem[]> {
  const types = await prisma.employmentType.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { staffs: true } },
    },
  });

  return types.map((t) => ({
    employmentTypeId: t.employment_type_id,
    code: t.code,
    name: t.name,
    thainame: t.thainame,
    description: t.description,
    isActive: t.is_active,
    staffCount: t._count.staffs,
  }));
}

export async function getEmploymentTypeById(id: string) {
  const et = await prisma.employmentType.findUnique({
    where: { employment_type_id: id },
    include: {
      _count: { select: { staffs: true } },
    },
  });
  if (!et) return null;
  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
    staffCount: et._count.staffs,
  };
}

export async function createEmploymentType(data: {
  name: string;
  thainame?: string | null;
  description?: string | null;
}) {
  const existingName = await prisma.employmentType.findUnique({
    where: { name: data.name },
    select: { employment_type_id: true },
  });
  if (existingName) {
    throw new ConflictError("ชื่อประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  if (data.thainame) {
    const existingThainame = await prisma.employmentType.findUnique({
      where: { thainame: data.thainame },
      select: { employment_type_id: true },
    });
    if (existingThainame) {
      throw new ConflictError("ชื่อภาษาไทยประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
    }
  }

  // auto-generate code as running number
  const lastCode = await prisma.employmentType.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let nextNum = 1;
  if (lastCode) {
    const match = lastCode.code.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const code = `EMP${String(nextNum).padStart(3, "0")}`;

  const et = await prisma.employmentType.create({
    data: {
      code,
      name: data.name,
      thainame: data.thainame ?? null,
      description: data.description ?? null,
    },
  });

  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
  };
}

export async function updateEmploymentType(
  id: string,
  data: {
    name: string;
    thainame?: string | null;
    description?: string | null;
  },
) {
  const existingName = await prisma.employmentType.findFirst({
    where: {
      name: data.name,
      employment_type_id: { not: id },
    },
    select: { employment_type_id: true },
  });
  if (existingName) {
    throw new ConflictError("ชื่อประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
  }

  if (data.thainame) {
    const existingThainame = await prisma.employmentType.findFirst({
      where: {
        thainame: data.thainame,
        employment_type_id: { not: id },
      },
      select: { employment_type_id: true },
    });
    if (existingThainame) {
      throw new ConflictError("ชื่อภาษาไทยประเภทพนักงานนี้มีอยู่ในระบบแล้ว");
    }
  }

  const et = await prisma.employmentType.update({
    where: { employment_type_id: id },
    data: {
      name: data.name,
      thainame: data.thainame ?? null,
      description: data.description ?? null,
      updated_at: new Date(),
    },
  });

  return {
    employmentTypeId: et.employment_type_id,
    code: et.code,
    name: et.name,
    thainame: et.thainame,
    description: et.description,
    isActive: et.is_active,
  };
}

export async function toggleEmploymentTypeActive(id: string, isActive: boolean) {
  const et = await prisma.employmentType.findUnique({
    where: { employment_type_id: id },
    select: { employment_type_id: true },
  });
  if (!et) {
    throw new NotFoundError("ไม่พบประเภทพนักงาน");
  }

  if (!isActive) {
    const staffCount = await prisma.staffInfo.count({
      where: { employment_type_id: id, is_active: true },
    });
    if (staffCount > 0) {
      throw new ConflictError("ไม่สามารถปิดประเภทพนักงานได้ เนื่องจากยังมีพนักงานที่ใช้งานอยู่");
    }
  }

  await prisma.employmentType.update({
    where: { employment_type_id: id },
    data: {
      is_active: isActive,
      updated_at: new Date(),
    },
  });
}

// Holiday CRUD
// ────────────────────────────────────

export type HolidayItem = {
  holidayId: string;
  holidayName: string;
  holidayDate: string;
  isRecurring: boolean;
};

export async function getHolidays(): Promise<HolidayItem[]> {
  const holidays = await prisma.holiday.findMany({
    select: { holiday_id: true, holiday_name: true, holiday_date: true, is_recurring: true },
    orderBy: { holiday_date: "asc" },
  });

  return holidays.map((h) => ({
    holidayId: h.holiday_id,
    holidayName: h.holiday_name,
    holidayDate: h.holiday_date.toISOString().split("T")[0],
    isRecurring: h.is_recurring,
  }));
}

export async function createHoliday(data: {
  holidayName: string;
  holidayDate: string;
  isRecurring?: boolean;
}): Promise<HolidayItem> {
  const holiday = await prisma.holiday.create({
    data: {
      holiday_name: data.holidayName,
      holiday_date: new Date(data.holidayDate),
      is_recurring: data.isRecurring ?? false,
    },
  });

  return {
    holidayId: holiday.holiday_id,
    holidayName: holiday.holiday_name,
    holidayDate: holiday.holiday_date.toISOString().split("T")[0],
    isRecurring: holiday.is_recurring,
  };
}

export async function updateHoliday(
  id: string,
  data: {
    holidayName: string;
    holidayDate: string;
    isRecurring?: boolean;
  },
): Promise<HolidayItem> {
  const holiday = await prisma.holiday.update({
    where: { holiday_id: id },
    data: {
      holiday_name: data.holidayName,
      holiday_date: new Date(data.holidayDate),
      is_recurring: data.isRecurring ?? false,
      updated_at: new Date(),
    },
  });

  return {
    holidayId: holiday.holiday_id,
    holidayName: holiday.holiday_name,
    holidayDate: holiday.holiday_date.toISOString().split("T")[0],
    isRecurring: holiday.is_recurring,
  };
}

export async function deleteHoliday(id: string): Promise<void> {
  await prisma.holiday.delete({
    where: { holiday_id: id },
  });
}
