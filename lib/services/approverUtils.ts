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

export async function getPositionIds(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const positions = await prisma.position.findMany({
    where: { position_name: { in: names }, is_active: true },
    select: { position_id: true },
  });
  return positions.map((p) => p.position_id);
}

/**
 * Batched "has approver" check for multiple workflow steps.
 * Resolves all distinct position names in a single query, then runs
 * each step's staff count in parallel — avoids the per-step getPositionIds
 * round-trip that checkApproverExists performs.
 */
export async function checkApproversExist(
  staffId: string,
  departmentId: string,
  approverTypes: string[],
): Promise<boolean[]> {
  if (approverTypes.length === 0) return [];

  // Collect distinct position names across all step types
  const nameSet = new Set<string>();
  for (const t of approverTypes) {
    const names = APPROVER_POSITION_NAMES[t];
    if (names?.length) names.forEach((n) => nameSet.add(n));
  }

  // Resolve all position ids in one query
  let nameToIds = new Map<string, string[]>();
  if (nameSet.size > 0) {
    const positions = await prisma.position.findMany({
      where: { position_name: { in: [...nameSet] }, is_active: true },
      select: { position_id: true, position_name: true },
    });
    nameToIds = new Map<string, string[]>();
    for (const p of positions) {
      const list = nameToIds.get(p.position_name) ?? [];
      list.push(p.position_id);
      nameToIds.set(p.position_name, list);
    }
  }

  // Run each step's staff count in parallel (share dept/staff, differ by position set)
  return Promise.all(
    approverTypes.map(async (t) => {
      if (t === "HR") return true; // HR step always has an approver
      const names = APPROVER_POSITION_NAMES[t];
      if (!names?.length) return false;

      const stepPositionIds: string[] = [];
      for (const n of names) {
        const ids = nameToIds.get(n);
        if (ids) stepPositionIds.push(...ids);
      }
      if (stepPositionIds.length === 0) return false;

      const count = await prisma.staffInfo.count({
        where: {
          department_id: departmentId,
          staff_id: { not: staffId },
          is_active: true,
          position_id: { in: stepPositionIds },
          staffRoles: { some: {} },
        },
      });
      return count > 0;
    }),
  );
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

/**
 * Batched "staff has authority" check across multiple (departmentId, approverType)
 * pairs for the SAME approver staff. Resolves all distinct position names in one
 * query, then runs each pair's count in parallel — avoids per-pair getPositionIds.
 */
export async function checkApproverForStaffBatch(
  approverStaffId: string,
  pairs: { departmentId: string; approverType: string }[],
): Promise<boolean[]> {
  if (pairs.length === 0) return [];

  // Collect distinct position names across all pairs
  const nameSet = new Set<string>();
  for (const p of pairs) {
    const names = APPROVER_POSITION_NAMES[p.approverType];
    if (names?.length) names.forEach((n) => nameSet.add(n));
  }

  // Resolve all position ids in a single query
  let nameToIds = new Map<string, string[]>();
  if (nameSet.size > 0) {
    const positions = await prisma.position.findMany({
      where: { position_name: { in: [...nameSet] }, is_active: true },
      select: { position_id: true, position_name: true },
    });
    nameToIds = new Map<string, string[]>();
    for (const p of positions) {
      const list = nameToIds.get(p.position_name) ?? [];
      list.push(p.position_id);
      nameToIds.set(p.position_name, list);
    }
  }

  return Promise.all(
    pairs.map(async (p) => {
      const names = APPROVER_POSITION_NAMES[p.approverType];
      if (!names?.length) return false;

      const stepPositionIds: string[] = [];
      for (const n of names) {
        const ids = nameToIds.get(n);
        if (ids) stepPositionIds.push(...ids);
      }
      if (stepPositionIds.length === 0) return false;

      const count = await prisma.staffInfo.count({
        where: {
          staff_id: approverStaffId,
          department_id: p.departmentId,
          is_active: true,
          position_id: { in: stepPositionIds },
          staffRoles: { some: {} },
        },
      });
      return count > 0;
    }),
  );
}
