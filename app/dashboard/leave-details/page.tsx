import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionUser } from "@/lib/auth";
import { getLeaveDetailById, type LeaveDetailResponse } from "@/lib/services/leaveService";
import { logReadAccess } from "@/lib/services/auditService";
import { ForbiddenError } from "@/lib/errors";
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

  // The only way into this page is a leaveId from the URL. A dead/missing
  // leaveId must not leave the user stranded on a URL they can't view — kick
  // them back to the dashboard (covers deep links from emails, bookmarks, and
  // the post-login `next` cookie for a leave the user cannot see).
  if (!leaveId) redirect("/dashboard");

  let initialDetail: LeaveDetailResponse | null = null;
  let initialError = "";

  // Mirrors GET /api/leaves/detail, including the messages and the audit log.
  try {
    const detail = await getLeaveDetailById(leaveId, user.staffId, user.roles);
    if (!detail) redirect("/dashboard");
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
  } catch (err) {
    if (err instanceof ForbiddenError) redirect("/dashboard");
    initialError = "Failed to fetch leave detail.";
  }

  return (
    <LeaveDetailsClient
      initialDetail={initialDetail}
      initialLeaveId={leaveId ?? null}
      initialError={initialError}
    />
  );
}
