import { NextRequest, NextResponse } from "next/server";
import { getLeaveDetailById } from "@/lib/services/leaveService";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logReadAccess } from "@/lib/services/auditService";
import { headers } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session?.staffId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get("leaveId");

    if (!leaveId) {
      return NextResponse.json(
        { error: "leaveId is required." },
        { status: 400 },
      );
    }

    const detail = await getLeaveDetailById(leaveId);

    if (!detail) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 },
      );
    }

    const isOwner = detail.staffId === session.staffId;
    const isHR = session.roles.includes("HR") || session.roles.includes("SUPER_ADMIN");
    let isSupervisor = false;

    if (!isOwner && !isHR) {
      const supervisorRecord = await prisma.staffSupervisor.findUnique({
        where: {
          staff_id_supervisor_id: {
            staff_id: detail.staffId,
            supervisor_id: session.staffId,
          },
        },
      });
      isSupervisor = !!supervisorRecord;
    }

    if (!isOwner && !isHR && !isSupervisor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const headersList = await headers();
    logReadAccess(session.userId, session.staffId, "leave", leaveId, headersList.get("x-forwarded-for")?.split(",")[0].trim(), headersList.get("user-agent") ?? undefined);

    return NextResponse.json({ data: detail });
  } catch (error) {
    console.error("Failed to fetch leave detail", error);
    return NextResponse.json(
      { error: "Failed to fetch leave detail." },
      { status: 500 },
    );
  }
}
