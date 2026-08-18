import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getLeaveHistoryByStaffId,
  getActiveLeaveOptions,
} from "@/lib/services/leaveService";
import LeaveHistoryClient from "./LeaveHistoryClient";

export const dynamic = "force-dynamic";

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

export default async function LeaveHistoryPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const startDate = monthStartStr();
  const endDate = monthEndStr();

  const [initialData, options] = await Promise.all([
    getLeaveHistoryByStaffId(user.staffId, {
      startDate,
      endDate,
      page: 1,
      limit: 5,
    }),
    getActiveLeaveOptions(),
  ]);

  return (
    <LeaveHistoryClient
      initialData={initialData}
      initialTypeOptions={options.leaveTypes}
      initialStartDate={startDate}
      initialEndDate={endDate}
    />
  );
}