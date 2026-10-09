import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import {
  getDepartments,
  getLeaveReport,
  getActiveLeaveOptions,
} from "@/lib/services/leaveService";
import LeaveReportClient from "./LeaveReportClient";

export const dynamic = "force-dynamic";

const REPORT_PAGE_SIZE = 20;

function monthStartStr(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

function monthEndStr(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().split("T")[0];
}

export default async function LeaveReportPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const startDate = monthStartStr();
  const endDate = monthEndStr();

  const [initialReport, departments, options] = await Promise.all([
    getLeaveReport({ startDate, endDate, page: 1, limit: REPORT_PAGE_SIZE }),
    getDepartments(),
    getActiveLeaveOptions(),
  ]);

  return (
    <LeaveReportClient
      initialReport={initialReport}
      initialDepartmentOptions={departments.map((d) => ({
        id: d.departmentId,
        name: d.departmentName,
      }))}
      initialLeaveTypeOptions={options.leaveTypes}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}
