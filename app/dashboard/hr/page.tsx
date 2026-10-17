import { requireSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Reveal } from "@/components/Reveal";
import { SectionSkeleton } from "./SectionSkeleton";
import { DashboardHeader } from "./DashboardHeader";
import {
  KpiSection,
  TrendChartSection,
  TypePieChartSection,
  DeptComparisonSection,
  StatusStatsSection,
  PendingApprovalSection,
  LeaveTimelineSection,
  RecentActivitiesSection,
  SuperAdminStatsSection,
} from "./DashboardSections";

export default async function HrDashboardPage() {
  const user = await requireSessionUser();
  const isHR = user.roles.includes("HR") || user.roles.includes("SUPER_ADMIN");
  if (!isHR) redirect("/dashboard");
  const isSuperAdmin = user.roles.includes("SUPER_ADMIN");

  return (
    <div className="space-y-5">
      <AppBreadcrumb items={[{ label: "Home", href: "/dashboard" }, { label: "Dashboard" }]} />

      <DashboardHeader name={user.name} isSuperAdmin={isSuperAdmin} />

      {isSuperAdmin && (
        <Suspense fallback={<SectionSkeleton className="h-28" />}>
          <Reveal>
            <SuperAdminStatsSection />
          </Reveal>
        </Suspense>
      )}

      <Suspense fallback={<SectionSkeleton className="h-44" />}>
        <Reveal>
          <KpiSection />
        </Reveal>
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <Suspense fallback={<SectionSkeleton className="h-72" />}>
            <Reveal>
              <TrendChartSection />
            </Reveal>
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<SectionSkeleton className="h-72" />}>
            <Reveal delay={0.06}>
              <TypePieChartSection />
            </Reveal>
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <Suspense fallback={<SectionSkeleton className="h-80" />}>
            <Reveal>
              <PendingApprovalSection />
            </Reveal>
          </Suspense>
        </div>
        <div className="lg:col-span-4">
          <Suspense fallback={<SectionSkeleton className="h-80" />}>
            <Reveal delay={0.06}>
              <LeaveTimelineSection />
            </Reveal>
          </Suspense>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <Suspense fallback={<SectionSkeleton className="h-72" />}>
            <Reveal>
              <DeptComparisonSection />
            </Reveal>
          </Suspense>
        </div>
        <div className="lg:col-span-6">
          <Suspense fallback={<SectionSkeleton className="h-72" />}>
            <Reveal delay={0.06}>
              <StatusStatsSection />
            </Reveal>
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<SectionSkeleton className="h-72" />}>
        <Reveal>
          <RecentActivitiesSection />
        </Reveal>
      </Suspense>
    </div>
  );
}
