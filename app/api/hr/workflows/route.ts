import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getWorkflows, createWorkflow } from "@/lib/services/leaveService";
import { createWorkflowSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await getWorkflows();
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error in GET /api/hr/workflows:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    if (!isHR) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createWorkflowSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((e) => e.message).join(", ") },
        { status: 400 },
      );
    }

    const result = await createWorkflow(parsed.data);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Error in POST /api/hr/workflows:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
