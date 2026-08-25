import { getLeaveTrendData, getLeaveTypeDistribution, getPendingApprovals, getTodaysLeave, getUpcomingLeave, getRecentActivities, getDeptLeaveComparison, getApprovalStatusStats } from "@/lib/services/dashboardService";
import { LeaveTrendChart } from "./LeaveTrendChart";
import { LeaveTypePieChart } from "./LeaveTypePieChart";
import { DeptLeaveComparison } from "./DeptLeaveComparison";
import { ApprovalStatusStats } from "./ApprovalStatusStats";
import { PendingApprovalTable } from "./PendingApprovalTable";
import { TodaysLeaveList } from "./TodaysLeaveList";
import { UpcomingLeave } from "./UpcomingLeave";
import { RecentActivities } from "./RecentActivities";

export function SectionSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-slate-200 bg-slate-100/70 ${className ?? ""}`}
    />
  );
}

export async function TrendChartSection() {
  const data = await getLeaveTrendData();
  return <LeaveTrendChart data={data} />;
}

export async function TypePieChartSection() {
  const data = await getLeaveTypeDistribution();
  return <LeaveTypePieChart data={data} />;
}

export async function DeptComparisonSection() {
  const data = await getDeptLeaveComparison();
  return <DeptLeaveComparison data={data} />;
}

export async function StatusStatsSection() {
  const data = await getApprovalStatusStats();
  return <ApprovalStatusStats data={data} />;
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
