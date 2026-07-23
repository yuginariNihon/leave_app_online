import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const debugSecret = process.env.DEBUG_SECRET;
  if (debugSecret && request.nextUrl.searchParams.get("secret") !== debugSecret) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const session = await getSessionUser();
    if (!session?.staffId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.roles.includes("SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 1. Get logged-in user's roles
    const userRoles = await prisma.staffRole.findMany({
      where: { staff_id: session.staffId },
      include: { role: { select: { role_id: true, role_name: true } } },
    });

    // 2. Get all roles in the database
    const allRoles = await prisma.role.findMany();

    // 3. Check some leave requests
    const leaveCount = await prisma.dataLeave.count();
    const pendingLeaveCount = await prisma.dataLeave.count({
      where: { leave_status: "pending" },
    });

    // 4. Check leave approvals
    const approvalCount = await prisma.leaveApproval.count();
    const pendingApprovalCount = await prisma.leaveApproval.count({
      where: { approval_status: "pending" },
    });

    // 5. Check if there are approvals for supervisor/admin
    const sampleApprovals = await prisma.leaveApproval.findMany({
      take: 5,
      include: {
        leave: {
          select: {
            leave_status: true,
            staff: { select: { name: true } },
          },
        },
        approver: { select: { name: true } },
      },
    });

    // 6. Test query like getPendingApprovals
    const isSuperAdmin = userRoles.some(
      (sr) => sr.role.role_name === "SUPER_ADMIN",
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      approval_status: "pending",
      leave: { leave_status: "pending" },
    };

    if (!isSuperAdmin) {
      where.approver_id = session.staffId;
    }

    const testPendingApprovals = await prisma.leaveApproval.findMany({
      where,
      include: {
        leave: {
          include: {
            leaveType: { select: { leave_type_name: true } },
            staff: { select: { name: true, staff_code: true } },
          },
        },
      },
    });

    return NextResponse.json({
      session,
      isSuperAdmin,
      userRoles,
      allRoles,
      counts: {
        totalLeaves: leaveCount,
        pendingLeaves: pendingLeaveCount,
        totalApprovals: approvalCount,
        pendingApprovals: pendingApprovalCount,
      },
      sampleApprovals,
      testPendingApprovals,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch {
    return NextResponse.json({ error: "Internal server error" });
  }
}
