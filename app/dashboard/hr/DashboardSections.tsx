import { getLeaveTrendData, getLeaveTypeDistribution, getPendingApprovals, getTodaysLeave, getUpcomingLeave, getRecentActivities, getDeptLeaveComparison, getApprovalStatusStats, getDashboardKpiData } from "@/lib/services/dashboardService";
import { KpiCards } from "./KpiCards";
import {
  DeferredTrendChart,
  DeferredTypePieChart,
  DeferredDeptComparison,
  DeferredStatusStats,
} from "./DeferredCharts";
import { PendingApprovalTable } from "./PendingApprovalTable";
import { TodaysLeaveList } from "./TodaysLeaveList";
import { UpcomingLeave } from "./UpcomingLeave";
import { RecentActivities } from "./RecentActivities";

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

export async function TodaysLeaveSection() {
  const data = await getTodaysLeave();
  return <TodaysLeaveList data={data} />;
}

export async function UpcomingLeaveSection() {
  const data = await getUpcomingLeave();
  return <UpcomingLeave data={data} />;
}

export async function RecentActivitiesSection() {
  const data = await getRecentActivities(10);
  return <RecentActivities data={data} />;
}
