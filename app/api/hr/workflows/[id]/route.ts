import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getWorkflowById, updateWorkflowSteps } from "@/lib/services/leaveService";
import { updateWorkflowStepsSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const workflow = await getWorkflowById(id);
    if (!workflow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: workflow });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const input = await parseBody(request, updateWorkflowStepsSchema);

    const workflow = await getWorkflowById(id);
    if (!workflow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await updateWorkflowSteps(id, input.steps);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
