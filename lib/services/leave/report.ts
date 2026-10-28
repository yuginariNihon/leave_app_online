import { LeaveStatus, Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { timeFromDb } from "@/lib/utils";

export type LeaveReportRecord = {
  leaveId: string;
  staffCode: string;
  staffName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  /** "day" | "hour" */
  leaveMode: string;
  startTime: string | null;
  endTime: string | null;
  hours: string | null;
  status: LeaveStatus;
  createdAt: string;
};

export type LeaveReportFilters = {
  search?: string;
  departmentId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
};

export type LeaveReportResult = {
  data: LeaveReportRecord[];
  total: number;
  approved: number;
  rejected: number;
  cancelled: number;
  page: number;
  totalPages: number;
  limit: number;
};

export async function getLeaveReport(
  filters: LeaveReportFilters,
): Promise<LeaveReportResult> {
  const {
    search,
    departmentId,
    leaveTypeId,
    startDate,
    endDate,
    page = 1,
    limit = 20,
  } = filters;

  const where: Prisma.DataLeaveWhereInput = {
    leave_status: {
      in: [LeaveStatus.approved, LeaveStatus.rejected, LeaveStatus.cancelled],
    },
  };

  const staffWhere: Prisma.StaffInfoWhereInput = {};

  if (departmentId) {
    staffWhere.department_id = departmentId;
  }

  if (search) {
    staffWhere.OR = [
      { staff_code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (Object.keys(staffWhere).length > 0) {
    where.staff = staffWhere;
  }

  if (leaveTypeId) {
    where.leave_type_id = leaveTypeId;
  }

  if (startDate) {
    where.start_date = {
      gte: new Date(`${startDate}T00:00:00.000Z`),
    };
  }

  if (endDate) {
    where.start_date = {
      ...(where.start_date as object),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    };
  }

  const [data, countGroup] = await Promise.all([
    prisma.dataLeave.findMany({
      where,
      include: {
        staff: {
          select: {
            staff_code: true,
            name: true,
            department: { select: { department_name: true } },
          },
        },
        leaveType: { select: { leave_type_name: true } },
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.dataLeave.groupBy({
      by: ["leave_status"],
      where,
      _count: true,
    }),
  ]);

  const total = countGroup.reduce((sum, g) => sum + g._count, 0);
  const approved = countGroup.find((g) => g.leave_status === LeaveStatus.approved)?._count ?? 0;
  const rejected = countGroup.find((g) => g.leave_status === LeaveStatus.rejected)?._count ?? 0;
  const cancelled = countGroup.find((g) => g.leave_status === LeaveStatus.cancelled)?._count ?? 0;

  return {
    data: data.map((item) => ({
      leaveId: item.leave_id,
      staffCode: item.staff.staff_code,
      staffName: item.staff.name,
      departmentName: item.staff.department?.department_name ?? null,
      leaveTypeName: item.leaveType.leave_type_name,
      startDate: item.start_date?.toISOString() ?? null,
      endDate: item.end_date?.toISOString() ?? null,
      totalDays: item.total_days?.toString() ?? null,
      leaveMode: item.leave_mode ?? "day",
      startTime: item.start_time ? timeFromDb(item.start_time) : null,
      endTime: item.end_time ? timeFromDb(item.end_time) : null,
      hours: item.hours?.toString() ?? null,
      status: item.leave_status,
      createdAt: item.created_at.toISOString(),
    })),
    total,
    approved,
    rejected,
    cancelled,
    page,
    totalPages: Math.ceil(total / limit),
    limit,
  };
}
