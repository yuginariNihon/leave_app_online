import { NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { getAvailableWorkflowPositions } from "@/lib/services/leaveService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const positions = await getAvailableWorkflowPositions();
    return NextResponse.json({ data: positions });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
