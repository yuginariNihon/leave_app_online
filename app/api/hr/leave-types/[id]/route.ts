import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody, readJson } from "@/lib/http";
import { getLeaveTypeById, updateLeaveType, toggleLeaveTypeActive } from "@/lib/services/leaveService";
import { updateLeaveTypeSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const lt = await getLeaveTypeById(id);
    if (!lt) {
      return NextResponse.json({ error: "Leave type not found" }, { status: 404 });
    }

    return NextResponse.json({ data: lt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;

    const input = await parseBody(request, updateLeaveTypeSchema);
    const lt = await updateLeaveType(id, input);
    return NextResponse.json({ data: lt });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const { isActive } = await readJson<{ isActive?: unknown }>(request);

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
    }

    await toggleLeaveTypeActive(id, isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
