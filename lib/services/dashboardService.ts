import { prisma } from "@/lib/prisma";
import { EmploymentStatus, LeaveStatus } from "@/lib/generated/prisma/client";

export type DashboardKpiData = {
  pendingApprovals: number;
  approvedToday: number;
  totalLeavesThisMonth: number;
  totalLeavesThisYear: number;
  activeStaffCount: number;
  terminatedStaffCount: number;
  leaveToday: number;
  avgApprovalHours: number;
};

export type LeaveTrendItem = {
  month: string;
  count: number;
};

export type LeaveTypeDistItem = {
  leaveTypeName: string;
  count: number;
};

export type PendingApprovalItem = {
  leaveId: string;
  staffName: string;
  leaveTypeName: string;
  caseName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
};

export type TodaysLeaveItem = {
  staffName: string;
  leaveTypeName: string;
  leavePeriod: string;
  departmentName: string;
};

export type UpcomingLeaveItem = {
  staffName: string;
  leaveTypeName: string;
  startDate: string;
  totalDays: number;
};

export type RecentActivityItem = {
  staffName: string;
  action: string;
  detail: string;
  timestamp: string;
};

export async function getDashboardKpiData(): Promise<DashboardKpiData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [pendingApprovals, approvedToday, totalLeavesThisMonth, totalLeavesThisYear, activeStaffCount, terminatedStaffCount, leaveToday, avgApprovalData] = await prisma.$transaction([
    prisma.dataLeave.count({ where: { leave_status: LeaveStatus.pending } }),
    prisma.dataLeave.count({ where: { leave_status: LeaveStatus.approved, updated_at: { gte: today } } }),
    prisma.dataLeave.count({ where: { created_at: { gte: monthStart } } }),
    prisma.dataLeave.count({ where: { created_at: { gte: yearStart } } }),
    prisma.staffInfo.count({ where: { employment_status: EmploymentStatus.active, is_active: true } }),
    prisma.staffInfo.count({ where: { employment_status: EmploymentStatus.terminated } }),
    prisma.dataLeave.count({
      where: {
        leave_status: LeaveStatus.approved,
        start_date: { lte: today },
        end_date: { gte: today },
      },
    }),
    prisma.dataLeave.findMany({
      where: { leave_status: LeaveStatus.approved },
      select: { created_at: true, updated_at: true },
      take: 1000,
    }),
  ]);

  let avgApprovalHours = 0;
  if (avgApprovalData.length > 0) {
    const totalMs = avgApprovalData.reduce((sum, l) => {
      return sum + (l.updated_at.getTime() - l.created_at.getTime());
    }, 0);
    avgApprovalHours = Math.round(totalMs / avgApprovalData.length / 360000);
  }

  return {
    pendingApprovals,
    approvedToday,
    totalLeavesThisMonth,
    totalLeavesThisYear,
    activeStaffCount,
    terminatedStaffCount,
    leaveToday,
    avgApprovalHours,
  };
}

export async function getLeaveTrendData(): Promise<LeaveTrendItem[]> {
  const rows = await prisma.$queryRaw<{ month: Date; count: bigint }[]>`
    SELECT DATE_TRUNC('month', created_at)::date AS month, COUNT(*)::int AS count
    FROM "DataLeave"
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC
  `;

  const now = new Date();
  const countsByMonth = new Map<string, number>();
  for (const r of rows) {
    const key = `${r.month.getFullYear()}-${r.month.getMonth()}`;
    countsByMonth.set(key, Number(r.count));
  }

  const result: LeaveTrendItem[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
    result.push({ month: label, count: countsByMonth.get(key) ?? 0 });
  }
  return result;
}

export async function getLeaveTypeDistribution(): Promise<LeaveTypeDistItem[]> {
  const types = await prisma.leaveType.findMany({
    where: { is_active: true },
    select: { leave_type_name: true, _count: { select: { leaves: true } } },
    orderBy: { leave_type_name: "asc" },
  });
  return types
    .filter((t) => t._count.leaves > 0)
    .map((t) => ({ leaveTypeName: t.leave_type_name, count: t._count.leaves }));
}

export async function getPendingApprovals(limit = 5): Promise<PendingApprovalItem[]> {
  const leaves = await prisma.dataLeave.findMany({
    where: { leave_status: LeaveStatus.pending },
    include: {
      staff: { select: { name: true } },
      leaveType: { select: { leave_type_name: true } },
      leaveCase: { select: { case_name: true } },
    },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return leaves.map((l) => ({
    leaveId: l.leave_id,
    staffName: l.staff.name,
    leaveTypeName: l.leaveType.leave_type_name,
    caseName: l.leaveCase.case_name,
    startDate: l.start_date?.toISOString().split("T")[0] ?? "",
    endDate: l.end_date?.toISOString().split("T")[0] ?? "",
    totalDays: Number(l.total_days ?? 0),
  }));
}

export async function getTodaysLeave(): Promise<TodaysLeaveItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaves = await prisma.dataLeave.findMany({
    where: {
      leave_status: LeaveStatus.approved,
      start_date: { lte: today },
      end_date: { gte: today },
    },
    include: {
      staff: { select: { name: true, department: { select: { department_name: true } } } },
      leaveType: { select: { leave_type_name: true } },
    },
    orderBy: { start_date: "asc" },
    take: 10,
  });

  return leaves.map((l) => ({
    staffName: l.staff.name,
    leaveTypeName: l.leaveType.leave_type_name,
    leavePeriod: l.leave_period,
    departmentName: l.staff.department?.department_name ?? "",
  }));
}

export async function getUpcomingLeave(daysAhead = 7): Promise<UpcomingLeaveItem[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + daysAhead);

  const leaves = await prisma.dataLeave.findMany({
    where: {
      leave_status: LeaveStatus.approved,
      start_date: { gte: today, lte: future },
      end_date: { gte: today },
    },
    include: {
      staff: { select: { name: true } },
      leaveType: { select: { leave_type_name: true } },
    },
    orderBy: { start_date: "asc" },
    take: 10,
  });

  return leaves.map((l) => ({
    staffName: l.staff.name,
    leaveTypeName: l.leaveType.leave_type_name,
    startDate: l.start_date?.toISOString().split("T")[0] ?? "",
    totalDays: Number(l.total_days ?? 0),
  }));
}

export async function getRecentActivities(limit = 10): Promise<RecentActivityItem[]> {
  const leaves = await prisma.dataLeave.findMany({
    include: {
      staff: { select: { name: true } },
      leaveType: { select: { leave_type_name: true } },
      leaveCase: { select: { case_name: true } },
    },
    orderBy: { updated_at: "desc" },
    take: limit,
  });

  return leaves.map((l) => {
    const actionMap: Record<string, string> = {
      pending: "ยื่นคำขอลา",
      approved: "อนุมัติคำขอลา",
      rejected: "ปฏิเสธคำขอลา",
      cancelled: "ยกเลิกคำขอลา",
    };

    return {
      staffName: l.staff.name,
      action: actionMap[l.leave_status] ?? l.leave_status,
      detail: `${l.leaveType.leave_type_name} — ${l.leaveCase.case_name}`,
      timestamp: l.updated_at.toISOString(),
    };
  });
}

// ── Phase 2: Analytics ──

export type DeptLeaveComparisonItem = {
  departmentName: string;
  totalLeaves: number;
};

export type ApprovalStatusStat = {
  status: string;
  count: number;
  color: string;
};

export type LeaveCalendarDay = {
  date: number;
  isToday: boolean;
  leaves: { staffName: string; leaveTypeName: string }[];
};

export type LeaveBalanceSummaryItem = {
  leaveTypeName: string;
  totalStaff: number;
  totalQuota: number;
  totalUsed: number;
  totalRemaining: number;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#10b981",
  rejected: "#ef4444",
  cancelled: "#6b7280",
};

export async function getDeptLeaveComparison(monthsBack = 6): Promise<DeptLeaveComparisonItem[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const rows = await prisma.$queryRaw<{ department_name: string; total_leaves: bigint }[]>`
    SELECT d.department_name, COUNT(dl.leave_id)::int AS total_leaves
    FROM "Department" d
    LEFT JOIN "StaffInfo" s ON s.department_id = d.department_id
    LEFT JOIN "DataLeave" dl ON dl.staff_id = s.staff_id AND dl.created_at >= ${since}
    GROUP BY d.department_id, d.department_name
    HAVING COUNT(dl.leave_id) > 0
    ORDER BY total_leaves DESC
  `;

  return rows.map((r) => ({
    departmentName: r.department_name,
    totalLeaves: Number(r.total_leaves),
  }));
}

export async function getApprovalStatusStats(): Promise<ApprovalStatusStat[]> {
  const entries = Object.entries(STATUS_COLORS);
  const counts = await prisma.$transaction(
    entries.map(([status]) => prisma.dataLeave.count({ where: { leave_status: status as LeaveStatus } }))
  );
  return entries
    .map(([status, color], i) => ({ status, count: counts[i], color }))
    .filter((r) => r.count > 0);
}

export async function getLeaveCalendarData(year: number, month: number): Promise<LeaveCalendarDay[]> {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const leaves = await prisma.dataLeave.findMany({
    where: {
      leave_status: LeaveStatus.approved,
      start_date: { lt: monthEnd },
      end_date: { gte: monthStart },
    },
    include: {
      staff: { select: { name: true } },
      leaveType: { select: { leave_type_name: true } },
    },
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const days: LeaveCalendarDay[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dateStr = dateObj.toISOString().split("T")[0];
    const dayLeaves = leaves
      .filter((l) => {
        const start = l.start_date?.toISOString().split("T")[0] ?? "";
        const end = l.end_date?.toISOString().split("T")[0] ?? "";
        return dateStr >= start && dateStr <= end;
      })
      .map((l) => ({ staffName: l.staff.name, leaveTypeName: l.leaveType.leave_type_name }));

    days.push({
      date: d,
      isToday: dateObj.getTime() === today.getTime(),
      leaves: dayLeaves,
    });
  }

  return days;
}

export async function getLeaveBalanceSummary(): Promise<LeaveBalanceSummaryItem[]> {
  const currentYear = new Date().getFullYear();

  const limits = await prisma.userLeaveLimit.findMany({
    where: { year: currentYear },
    include: { leaveType: { select: { leave_type_name: true } } },
  });

  const grouped: Record<string, { totalStaff: number; totalQuota: number; totalUsed: number }> = {};

  for (const l of limits) {
    const name = l.leaveType.leave_type_name;
    if (!grouped[name]) {
      grouped[name] = { totalStaff: 0, totalQuota: 0, totalUsed: 0 };
    }
    grouped[name].totalStaff++;
    grouped[name].totalQuota += Number(l.max_days);
    grouped[name].totalUsed += Number(l.used_days);
  }

  return Object.entries(grouped)
    .map(([leaveTypeName, g]) => ({
      leaveTypeName,
      totalStaff: g.totalStaff,
      totalQuota: g.totalQuota,
      totalUsed: g.totalUsed,
      totalRemaining: g.totalQuota - g.totalUsed,
    }))
    .sort((a, b) => a.leaveTypeName.localeCompare(b.leaveTypeName));
}
