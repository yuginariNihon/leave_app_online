import { getTodaysLeave, getUpcomingLeave, getLeaveTrendData, getLeaveTypeDistribution, getPendingApprovals, getRecentActivities, getDeptLeaveComparison, getApprovalStatusStats, getDashboardKpiData } from "@/lib/services/dashboardService";
import { getRoleManageList, getUserList } from "@/lib/services/leaveService";
import { getPagePermissions } from "@/lib/services/rolePermissionService";
import { KpiCards } from "./KpiCards";
import {
  DeferredTrendChart,
  DeferredTypePieChart,
  DeferredDeptComparison,
  DeferredStatusStats,
} from "./DeferredCharts";
import { PendingApprovalTable } from "./PendingApprovalTable";
import { LeaveTimelineCard } from "./LeaveTimelineCard";
import { RecentActivities } from "./RecentActivities";
import { SuperAdminStats } from "./SuperAdminStats";

export async function KpiSection() {
  const data = await getDashboardKpiData();
  return <KpiCards data={data} />;
}

export async function TrendChartSection() {
  const data = await getLeaveTrendData();
  return <DeferredTrendChart data={data} />;
}

export async function TypePieChartSection() {
  const data = await getLeaveTypeDistribution();
  return <DeferredTypePieChart data={data} />;
}

export async function DeptComparisonSection() {
  const data = await getDeptLeaveComparison();
  return <DeferredDeptComparison data={data} />;
}

export async function StatusStatsSection() {
  const data = await getApprovalStatusStats();
  return <DeferredStatusStats data={data} />;
}

export async function PendingApprovalSection() {
  const data = await getPendingApprovals(5);
  return <PendingApprovalTable data={data} />;
}

export async function LeaveTimelineSection() {
  const [todays, upcoming] = await Promise.all([getTodaysLeave(), getUpcomingLeave()]);
  return <LeaveTimelineCard todays={todays} upcoming={upcoming} />;
}

export async function RecentActivitiesSection() {
  const data = await getRecentActivities(10);
  return <RecentActivities data={data} />;
}

export async function SuperAdminStatsSection() {
  const [roles, usersTotal, usersActive, pages] = await Promise.all([
    getRoleManageList(),
    getUserList({ limit: 1 }),
    getUserList({ isActive: true, limit: 1 }),
    getPagePermissions(),
  ]);

  return (
    <SuperAdminStats
      data={{
        totalRoles: roles.length,
        activeRoles: roles.filter((role) => role.isActive).length,
        totalUsers: usersTotal.total,
        activeUsers: usersActive.total,
        inactiveUsers: Math.max(usersTotal.total - usersActive.total, 0),
        totalPages: pages.length,
      }}
    />
  );
}
