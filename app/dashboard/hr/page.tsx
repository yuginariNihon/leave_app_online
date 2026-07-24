
import { requireSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, History, List, CalendarDays } from "lucide-react";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import {
  getDashboardKpiData,
  getLeaveTrendData,
  getLeaveTypeDistribution,
  getPendingApprovals,
  getTodaysLeave,
  getUpcomingLeave,
  getRecentActivities,
  getDeptLeaveComparison,
  getApprovalStatusStats,
} from "@/lib/services/dashboardService";
import { KpiCards } from "./KpiCards";
import { LeaveTrendChart } from "./LeaveTrendChart";
import { LeaveTypePieChart } from "./LeaveTypePieChart";
import { DeptLeaveComparison } from "./DeptLeaveComparison";
import { ApprovalStatusStats } from "./ApprovalStatusStats";
import { PendingApprovalTable } from "./PendingApprovalTable";
import { TodaysLeaveList } from "./TodaysLeaveList";
import { UpcomingLeave } from "./UpcomingLeave";
import { RecentActivities } from "./RecentActivities";

export default async function HrDashboardPage() {
  const user = await requireSessionUser();
  const isHR = user.roles.includes("HR") || user.roles.includes("SUPER_ADMIN");
  if (!isHR) redirect("/dashboard");

  const [
    kpiData,
    trendData,
    typeDist,
    deptComparison,
    statusStats,
    pendingApprovals,
    todaysLeave,
    upcomingLeave,
    recentActivities,
  ] = await Promise.all([
    getDashboardKpiData(),
    getLeaveTrendData(),
    getLeaveTypeDistribution(),
    getDeptLeaveComparison(),
    getApprovalStatusStats(),
    getPendingApprovals(5),
    getTodaysLeave(),
    getUpcomingLeave(),
    getRecentActivities(10),
  ]);

  return (

        <div className="space-y-6 max-w-[1200px] mx-auto w-full">
          <AppBreadcrumb
            items={[{ label: "Home", href: "/dashboard" }, { label: "HR Dashboard" }]}
            className="mb-4"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#1a1a40]">
              สวัสดี, {user.name}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              แผงควบคุมสำหรับเจ้าหน้าที่ทรัพยากรบุคคล
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/approval-requests/hr"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a1a40] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a40]">อนุมัติคำขอลา (HR)</p>
                <p className="text-sm text-slate-500">ตรวจสอบและอนุมัติคำขอลาที่รอดำเนินการ</p>
              </div>
            </Link>

            <Link
              href="/dashboard/approval-requests/history?roleType=hr"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a1a40] flex items-center justify-center">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a40]">ประวัติการอนุมัติ</p>
                <p className="text-sm text-slate-500">ดูประวัติการอนุมัติทั้งหมด</p>
              </div>
            </Link>

            <Link
              href="/dashboard/leave-history"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a1a40] flex items-center justify-center">
                <List className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a40]">รายการลา</p>
                <p className="text-sm text-slate-500">ดูรายการคำขอลาทั้งหมด</p>
              </div>
            </Link>

            <Link
              href="/dashboard/leave-calendar"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1a1a40] flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-[#1a1a40]">ปฏิทินการลา</p>
                <p className="text-sm text-slate-500">ดูปฏิทินการลาของพนักงาน</p>
              </div>
            </Link>
          </div>

          <KpiCards data={kpiData} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LeaveTrendChart data={trendData} />
            <LeaveTypePieChart data={typeDist} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DeptLeaveComparison data={deptComparison} />
            <ApprovalStatusStats data={statusStats} />
          </div>

          <PendingApprovalTable data={pendingApprovals} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TodaysLeaveList data={todaysLeave} />
            <UpcomingLeave data={upcomingLeave} />
          </div>

          <RecentActivities data={recentActivities} />
        </div>

  );
}
