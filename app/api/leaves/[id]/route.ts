import { NextRequest, NextResponse } from "next/server";
import { updateLeaveRequest, validateLeaveRequestDetails } from "@/lib/services/leaveService";
import { getLeaveDetailById } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";
import { createLeaveRequestSchema } from "@/lib/TypeSchema";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    console.error("Failed to fetch leave detail", error);
    return NextResponse.json(
      { error: "Failed to fetch leave detail." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = createLeaveRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid leave request payload.",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { isStaffValid, isLeaveTypeValid, isLeaveCaseValid } =
      await validateLeaveRequestDetails(session.staffId, parsed.data.leaveTypeId, parsed.data.leaveCaseId);

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
      leaveTypeId: parsed.data.leaveTypeId,
      leaveCaseId: parsed.data.leaveCaseId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      reason: parsed.data.reason,
      totalDays: parsed.data.totalDays,
      leavePeriod: parsed.data.leavePeriod,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update leave request." }, { status: 400 });
  }
}
