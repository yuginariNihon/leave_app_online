import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getLeaveCaseById, updateLeaveCase, toggleLeaveCaseActive } from "@/lib/services/leaveService";
import { updateLeaveCaseSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const c = await getLeaveCaseById(id);
    if (!c) {
      return NextResponse.json({ error: "Leave case not found" }, { status: 404 });
    }

    return NextResponse.json({ data: c });
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

    const body = await request.json();
    const parsed = updateLeaveCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const c = await updateLeaveCase(id, parsed.data);
    return NextResponse.json({ data: c });
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
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive (boolean) is required" }, { status: 400 });
    }

    await toggleLeaveCaseActive(id, isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
