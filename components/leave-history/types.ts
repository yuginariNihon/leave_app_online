import { LeaveStatus } from "@/lib/generated/prisma/enums";

export interface LeaveRecord {
  leaveId: string;
  leaveTypeName: string;
  leaveCaseName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  status: LeaveStatus;
  createdAt: string;
}

export const statusTextMap: Record<LeaveStatus, string> = {
  [LeaveStatus.pending]: "รอการอนุมัติ",
  [LeaveStatus.approved]: "ได้รับการอนุมัติ",
  [LeaveStatus.rejected]: "ไม่ได้รับการอนุมัติ",
  [LeaveStatus.cancelled]: "คำขอนี้ถูกยกเลิก",
};
