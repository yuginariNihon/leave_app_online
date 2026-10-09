import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getLeaveCalendar } from "@/lib/services/leaveService";
import { getHrPendingApprovals, getPendingApprovals } from "@/lib/services/approvalService";
import LeaveCalendarClient from "./LeaveCalendarClient";

export const dynamic = "force-dynamic";

type PendingRequest = {
  leaveId: string;
  staffName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
};

export default async function LeaveCalendarPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const isAuthorized = user.roles.some((r) =>
    ["HR", "SUPER_ADMIN", "APPROVER"].includes(r.toUpperCase()),
  );
  if (!isAuthorized) redirect("/dashboard");

  const isHR = user.roles.includes("HR") || user.roles.includes("SUPER_ADMIN");
  const now = new Date();
  const monthParam = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [calendar, pending] = await Promise.all([
    getLeaveCalendar(monthParam),
    isHR
      ? getHrPendingApprovals(user.staffId, 1, 2)
      : getPendingApprovals(user.staffId, 1, 2),
  ]);

  const initialPendingReqs: PendingRequest[] = (pending?.data ?? []).map((r) => ({
    leaveId: r.leaveId,
    staffName: r.staffName,
    leaveTypeName: r.leaveTypeName,
    startDate: r.startDate ?? "",
    endDate: r.endDate ?? "",
  }));

  return (
    <LeaveCalendarClient
      initialDays={calendar.days}
      initialPendingReqs={initialPendingReqs}
    />
  );
}
