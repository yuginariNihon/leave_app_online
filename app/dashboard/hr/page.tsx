import React from "react";
import { requireSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, History, Clock, FileText, Users, Building2, Briefcase, Tags, UserCog, GitBranch, BarChart3, CaseSensitive, Shield, UserPlus, CalendarDays } from "lucide-react";
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
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      <main className="flex-grow p-4 space-y-6 max-w-[1200px] mx-auto w-full">
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
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#1a1a40] mb-4">จัดการระบบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link
              href="/dashboard/hr/staff-list"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">รายชื่อพนักงาน</p>
            </Link>

            <Link
              href="/dashboard/hr/departments"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการแผนก</p>
            </Link>

            <Link
              href="/dashboard/hr/positions"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการตำแหน่ง</p>
            </Link>

            <Link
              href="/dashboard/hr/leave-types"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Tags className="w-5 h-5 text-rose-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการประเภทการลา</p>
            </Link>

            <Link
              href="/dashboard/hr/leave-cases"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <CaseSensitive className="w-5 h-5 text-teal-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการกรณีการลา</p>
            </Link>

            <Link
              href="/dashboard/hr/employee-types"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-orange-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการประเภทพนักงาน</p>
            </Link>

            <Link
              href="/dashboard/hr/workflows"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-pink-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการลำดับการอนุมัติ</p>
            </Link>

            <Link
              href="/dashboard/hr/leave-report"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sky-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">รายงานการลา</p>
            </Link>

            <Link
              href="/dashboard/hr/sections"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการแผนกย่อย</p>
            </Link>

            <Link
              href="/dashboard/hr/holidays"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-amber-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการวันหยุด</p>
            </Link>

            <Link
              href="/dashboard/hr/user-management"
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-cyan-600" />
              </div>
              <p className="font-semibold text-sm text-[#1a1a40]">จัดการผู้ใช้</p>
            </Link>

            {user.roles.includes("SUPER_ADMIN") && (
              <>
                <Link
                  href="/dashboard/hr/staff-roles"
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="font-semibold text-sm text-[#1a1a40]">จัดการสิทธิ์ของพนักงาน</p>
                </Link>

                <Link
                  href="/dashboard/admin/roles"
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="font-semibold text-sm text-[#1a1a40]">จัดการบทบาทพนักงาน</p>
                </Link>

                <Link
                  href="/dashboard/admin/page-permissions"
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col items-center gap-2 text-center"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="font-semibold text-sm text-[#1a1a40]">จัดการสิทธิ์การเข้าถึงหน้า</p>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="border-t-2 border-slate-300 my-6"></div>

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
      </main>
    </div>
  );
}
