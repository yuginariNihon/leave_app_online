import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody } from "@/lib/http";
import { getWorkflows, createWorkflow } from "@/lib/services/leaveService";
import { createWorkflowSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const data = await getWorkflows();
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const input = await parseBody(request, createWorkflowSchema);
    const result = await createWorkflow(input);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
