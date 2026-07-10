import { prisma } from "@/lib/prisma";

export const APPROVER_POSITION_NAMES: Record<string, string[]> = {
  Supervisor: ["Supervisor"],
  Senior_Supervisor: ["Senior Supervisor"],
  Supervisor_or_Senior_Supervisor: ["Supervisor", "Senior Supervisor"],
  Assistant_Manager: ["Assistant Manager"],
  Department_Manager: ["Manager"],
  General_Manager: ["General Manager"],
  Director: ["Director"],
  HR: [],
  Specific_Person: [],
};

export const APPROVER_TYPE_LABELS: Record<string, string> = {
  Supervisor: "Supervisor",
  Senior_Supervisor: "Senior Supervisor",
  Supervisor_or_Senior_Supervisor: "Supervisor or Senior Supervisor",
  Assistant_Manager: "Assistant Manager",
  Department_Manager: "Manager",
  General_Manager: "General Manager",
  Director: "Director",
  HR: "HR",
  Specific_Person: "Specific Person",
};

/**
 * Checks whether at least one valid approver exists in the department
 * for the given ApproverType (position + any StaffRole).
 */
export async function checkApproverExists(
  staffId: string,
  departmentId: string,
  approverType: string,
): Promise<boolean> {
  // HR step always has an approver (role-based, not position-based) — no auto-skip
  if (approverType === "HR") return true;

  const positionNames = APPROVER_POSITION_NAMES[approverType];
  if (!positionNames?.length) return false;

  const positionIds = await getPositionIds(positionNames);
  if (positionIds.length === 0) return false;

  const count = await prisma.staffInfo.count({
    where: {
      department_id: departmentId,
      staff_id: { not: staffId },
      is_active: true,
      position_id: { in: positionIds },
      staffRoles: { some: {} },
    },
  });

  return count > 0;
}

async function getPositionIds(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const positions = await prisma.position.findMany({
    where: { position_name: { in: names }, is_active: true },
    select: { position_id: true },
  });
  return positions.map((p) => p.position_id);
}

/**
 * Checks whether the given staff has authority to approve
 * (position matches approver type + has any StaffRole).
 */
export async function checkApproverForStaff(
  approverStaffId: string,
  departmentId: string,
  approverType: string,
): Promise<boolean> {
  const positionNames = APPROVER_POSITION_NAMES[approverType];
  if (!positionNames?.length) return false;

  const positionIds = await getPositionIds(positionNames);
  if (positionIds.length === 0) return false;

  const count = await prisma.staffInfo.count({
    where: {
      staff_id: approverStaffId,
      department_id: departmentId,
      is_active: true,
      position_id: { in: positionIds },
      staffRoles: { some: {} },
    },
  });

  return count > 0;
}
