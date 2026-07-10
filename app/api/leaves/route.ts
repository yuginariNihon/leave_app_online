import { NextResponse } from "next/server";
import {
  createLeaveRequest,
  validateLeaveRequestDetails,
  type CreateLeaveRequestInput,
} from "@/lib/services/leaveService";
import {
  createLeaveRequestSchema,
  type CreateLeaveRequestValues,
} from "@/lib/TypeSchema";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

async function buildCreateLeaveRequestInput(
  input: CreateLeaveRequestValues,
  staffId: string,
): Promise<CreateLeaveRequestInput | { error: string }> {


  const { isStaffValid, isLeaveTypeValid, isLeaveCaseValid } =
    await validateLeaveRequestDetails(staffId, input.leaveTypeId, input.leaveCaseId);

  if (!isStaffValid) {
    return { error: "Invalid or inactive staffId." };
  }

  if (!isLeaveTypeValid) {
    return { error: "Invalid or inactive leaveTypeId." };
  }

  if (!isLeaveCaseValid) {
    return {
      error:
        "Invalid leaveCaseId, or it does not belong to the selected leaveTypeId.",
    };
  }

  return {
    staffId,
    leaveTypeId: input.leaveTypeId,
    leaveCaseId: input.leaveCaseId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    totalDays: input.totalDays,
  };
}

function serializeDataLeave(leave: Awaited<ReturnType<typeof createLeaveRequest>>) {
  return {
    leave_id: leave.leave_id,
    staff_id: leave.staff_id,
    leave_type_id: leave.leave_type_id,
    leave_case_id: leave.leave_case_id,
    start_date: leave.start_date?.toISOString() ?? null,
    end_date: leave.end_date?.toISOString() ?? null,
    total_days: leave.total_days?.toString() ?? null,
    reason: leave.reason,
    leave_status: leave.leave_status,
    created_at: leave.created_at.toISOString(),
    updated_at: leave.updated_at.toISOString(),
  };
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || !session.staffId) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in first." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

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

  try {
    const createInput = await buildCreateLeaveRequestInput(parsed.data, session.staffId);

    if ("error" in createInput) {
      return NextResponse.json(
        {
          error: createInput.error,
        },
        { status: 400 },
      );
    }

    const leave = await createLeaveRequest(createInput);

    return NextResponse.json(
      {
        data: serializeDataLeave(leave),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create leave request", error);

    return NextResponse.json(
      {
        error: "Failed to create leave request.",
      },
      { status: 500 },
    );
  }
}
