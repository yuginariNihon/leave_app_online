"use client";

// recharts is ~100KB of the /dashboard/hr client bundle, and all four charts sit
// below the KPI cards + quick links. Loading them only once the card approaches
// the viewport keeps them out of the initial payload.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ApprovalStatusStat,
  DeptLeaveComparisonItem,
  LeaveTrendItem,
  LeaveTypeDistItem,
} from "@/lib/services/dashboardService";
import { SectionSkeleton } from "./SectionSkeleton";

const LeaveTrendChart = dynamic(
  () => import("./LeaveTrendChart").then((m) => m.LeaveTrendChart),
  { ssr: false },
);
const LeaveTypePieChart = dynamic(
  () => import("./LeaveTypePieChart").then((m) => m.LeaveTypePieChart),
  { ssr: false },
);
const DeptLeaveComparison = dynamic(
  () => import("./DeptLeaveComparison").then((m) => m.DeptLeaveComparison),
  { ssr: false },
);
const ApprovalStatusStats = dynamic(
  () => import("./ApprovalStatusStats").then((m) => m.ApprovalStatusStats),
  { ssr: false },
);

function useNearViewport<T extends Element>() {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      // No IO support: reveal on the next frame instead of cascading a
      // synchronous render inside the effect.
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near]);

  return { ref, near };
}

function DeferredCard({
  skeletonClassName,
  children,
}: {
  skeletonClassName: string;
  children: ReactNode;
}) {
  const { ref, near } = useNearViewport<HTMLDivElement>();
  return <div ref={ref}>{near ? children : <SectionSkeleton className={skeletonClassName} />}</div>;
}

export function DeferredTrendChart({ data }: { data: LeaveTrendItem[] }) {
  return (
    <DeferredCard skeletonClassName="h-72">
      <LeaveTrendChart data={data} />
    </DeferredCard>
  );
}

export function DeferredTypePieChart({ data }: { data: LeaveTypeDistItem[] }) {
  return (
    <DeferredCard skeletonClassName="h-72">
      <LeaveTypePieChart data={data} />
    </DeferredCard>
  );
}

export function DeferredDeptComparison({ data }: { data: DeptLeaveComparisonItem[] }) {
  return (
    <DeferredCard skeletonClassName="h-72">
      <DeptLeaveComparison data={data} />
    </DeferredCard>
  );
}

export function DeferredStatusStats({ data }: { data: ApprovalStatusStat[] }) {
  return (
    <DeferredCard skeletonClassName="h-72">
      <ApprovalStatusStats data={data} />
    </DeferredCard>
  );
}
