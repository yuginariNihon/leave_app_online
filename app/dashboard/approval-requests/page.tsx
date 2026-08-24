import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPendingApprovals } from "@/lib/services/approvalService";
import { getActiveLeaveOptions } from "@/lib/services/leaveService";
import ApprovalRequestsClient from "./ApprovalRequestsClient";

export const dynamic = "force-dynamic";

export default async function ApprovalRequestsPage() {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const [initialData, options] = await Promise.all([
    getPendingApprovals(user.staffId, 1, 10),
    getActiveLeaveOptions(),
  ]);

  return (
    <ApprovalRequestsClient
      initialData={initialData.data}
      initialTotal={initialData.total}
      initialTotalPages={initialData.totalPages}
      initialTypeOptions={options.leaveTypes}
    />
  );
}