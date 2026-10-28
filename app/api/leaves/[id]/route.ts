import { NextRequest, NextResponse } from "next/server";
import { updateLeaveRequest, validateLeaveRequestDetails, LeaveRequestValidationError } from "@/lib/services/leaveService";
import { getLeaveDetailById } from "@/lib/services/leaveService";
import { requireAuth } from "@/lib/api-guards";
import { createLeaveRequestSchema } from "@/lib/TypeSchema";
import { logReadAccess } from "@/lib/services/auditService";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const detail = await getLeaveDetailById(id, session.staffId, session.roles);

    if (!detail) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 },
      );
    }

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "leave", id, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json({ data: detail });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const input = await parseBody(request, createLeaveRequestSchema);

    const { isStaffValid, isLeaveTypeValid, isLeaveCaseValid } =
      await validateLeaveRequestDetails(session.staffId, input.leaveTypeId, input.leaveCaseId);

    if (!isStaffValid) {
      return NextResponse.json({ error: "Invalid or inactive staffId." }, { status: 400 });
    }

    if (!isLeaveTypeValid) {
      return NextResponse.json({ error: "Invalid or inactive leaveTypeId." }, { status: 400 });
    }

    if (!isLeaveCaseValid) {
      return NextResponse.json(
        { error: "Invalid leaveCaseId, or it does not belong to the selected leaveTypeId." },
        { status: 400 },
      );
    }

    await updateLeaveRequest(id, session.staffId, {
      leaveTypeId: input.leaveTypeId,
      leaveCaseId: input.leaveCaseId,
      startDate: input.startDate,
      endDate: input.endDate,
      reason: input.reason,
      leavePeriod: input.leavePeriod,
      leaveMode: input.leaveMode,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof LeaveRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    return apiErrorResponse(error);
  }
}
