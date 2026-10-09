import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { getLeaveDetailById, type LeaveDetailResponse } from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import LeaveDetailsClient from "./LeaveDetailsClient";

export const dynamic = "force-dynamic";

export default async function LeaveDetailsPage({
  searchParams,
}: {
  searchParams: Promise<{ leaveId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user?.staffId) redirect("/login");

  const { leaveId } = await searchParams;

  let initialDetail: LeaveDetailResponse | null = null;
  let initialError = "";

  if (leaveId) {
    // Mirrors GET /api/leaves/detail, including the messages and the audit log.
    try {
      const detail = await getLeaveDetailById(leaveId, user.staffId, user.roles);
      if (detail) {
        initialDetail = detail;
        const headersList = await headers();
        logReadAccess(
          user.userId,
          user.staffId,
          "leave",
          leaveId,
          headersList.get("x-forwarded-for")?.split(",")[0].trim(),
          headersList.get("user-agent") ?? undefined,
        );
      } else {
        initialError = "Leave request not found.";
      }
    } catch (err) {
      initialError =
        err instanceof Error && err.message === "Forbidden"
          ? "Forbidden"
          : "Failed to fetch leave detail.";
    }
  }

  return (
    <LeaveDetailsClient
      initialDetail={initialDetail}
      initialLeaveId={leaveId ?? null}
      initialError={initialError}
    />
  );
}
