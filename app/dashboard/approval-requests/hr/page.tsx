import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getHrPendingApprovals } from "@/lib/services/approvalService";
import { getActiveLeaveOptions } from "@/lib/services/leaveService";
import HrApprovalRequestsClient from "./HrApprovalRequestsClient";

export const dynamic = "force-dynamic";

export default async function HrApprovalRequestsPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const [initialData, options] = await Promise.all([
    getHrPendingApprovals(user.staffId, 1, 10),
    getActiveLeaveOptions(),
  ]);

  return (
    <HrApprovalRequestsClient
      initialData={initialData.data}
      initialTotal={initialData.total}
      initialTotalPages={initialData.totalPages}
      initialTypeOptions={options.leaveTypes}
    />
  );
}