import { NextRequest, NextResponse } from "next/server";
import { requireHR } from "@/lib/api-guards";
import { apiErrorResponse } from "@/lib/errors";
import { parseBody, readJson } from "@/lib/http";
import { getSectionById, updateSection, toggleSectionActive } from "@/lib/services/leaveService";
import { updateSectionSchema } from "@/lib/TypeSchema";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireHR();
    if (auth.error) return auth.error;

    const { id } = await params;
    const section = await getSectionById(id);
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ data: section });
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

    const input = await parseBody(request, updateSectionSchema);
    const section = await updateSection(id, input);
    return NextResponse.json({ data: section });
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

    await toggleSectionActive(id, isActive);
    return NextResponse.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
