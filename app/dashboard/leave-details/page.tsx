"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeaveDetailsHeader } from "@/components/leave-details/LeaveDetailsHeader";
import { LeaveDetailsMainInfo } from "@/components/leave-details/LeaveDetailsMainInfo";
import { LeaveDetailsApprovalSidebar } from "@/components/leave-details/LeaveDetailsApprovalSidebar";
import { LeaveDetailsActions } from "@/components/leave-details/LeaveDetailsActions";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { LeaveDetailResponse } from "@/lib/services/leaveService";
import { getLeaveDetailId } from "@/lib/navigation-state";
import { formatDateTime } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

function buildActivities(detail: LeaveDetailResponse) {
  const activities: Array<{ title: string; date: string; isCurrent: boolean; subtitle?: string }> =
    [
      {
        title: "ส่งคำขอลาหยุด",
        date: formatDateTime(detail.createdAt),
        isCurrent: false,
      },
    ];

  if (detail.status === "cancelled") {
    activities.push({
      title: "ยกเลิกคำขอ",
      date: "ปัจจุบัน",
      isCurrent: true,
    });
  } else if (detail.approvals.length > 0) {
    detail.approvals.forEach((a) => {
      const baseTitle =
        a.status === "approved"
          ? "ได้รับอนุมัติแล้ว"
          : a.status === "rejected"
            ? "ไม่ได้รับอนุมัติ"
            : "รอการพิจารณา";

      const suffix =
        a.status !== "pending"
          ? `โดย ${a.approverName}`
          : "รอการพิจารณา";

      const subtitle = a.approverRole ? `(${a.approverRole})` : undefined;

      activities.push({
        title: `${baseTitle} ${suffix}`,
        subtitle,
        date: a.approvedAt ? formatDateTime(a.approvedAt) : "ปัจจุบัน",
        isCurrent: a.status === "pending",
      });
    });
  } else {
    activities.push({
      title: "รอการพิจารณาจากหัวหน้างาน",
      date: "ปัจจุบัน",
      isCurrent: true,
    });
  }

  return activities;
}

export default function LeaveDetailsPage() {
  const router = useRouter();

  const [detail, setDetail] = useState<LeaveDetailResponse | null>(null);
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const searchParams = useSearchParams();

  const fetchDetail = useCallback(async () => {
    const idFromUrl = searchParams?.get("leaveId") ?? null;
    const id = idFromUrl ?? getLeaveDetailId();

    if (!id) {
      setLoading(false);
      setError("ไม่พบรหัสคำขอลา");
      return;
    }

    setLeaveId(id);
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/leaves/detail?leaveId=${encodeURIComponent(id)}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to fetch leave detail");
      }

      setDetail(json.data ?? null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch leave detail",
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDetail();
  }, [fetchDetail]);

  const handleCancel = async () => {
    if (!leaveId) return;

    setCancelling(true);

    try {
      const res = await fetch(`/api/leaves/${leaveId}/cancel`, {
        method: "PATCH",
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to cancel leave");
      }

      router.push("/dashboard/leave-history");
      toast.success("ยกเลิกคำขอลาเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ไม่สามารถยกเลิกคำขอลาได้",
      );
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf8fc] flex items-center justify-center font-sans">
        <p className="text-slate-500">กำลังโหลด...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#fcf8fc] flex flex-col items-center justify-center gap-4 font-sans">
        <p className="text-red-500">{error ?? "ไม่พบข้อมูล"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          กลับ
        </Button>
      </div>
    );
  }

  const activities = buildActivities(detail);

  const displayReferenceId = detail.leaveId
    ? `#NFT-${detail.leaveId.slice(0, 4)}`
    : detail.referenceId ?? "";

  return (
    <div className="min-h-screen bg-[#fcf8fc] flex flex-col font-sans">
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-10">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "Leave Details" }]}
          className="mb-4"
        />
        <div className="mb-8 flex justify-between items-center">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-[#1a1a40] font-semibold hover:bg-[#1a1a40]/5"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้าประวัติ
          </Button>
        </div>

        <Card className="bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#1a1a40]/5 to-transparent rounded-bl-full pointer-events-none"></div>

          <LeaveDetailsHeader
            title="รายละเอียดคำขอลา"
            referenceId={displayReferenceId}
            status={detail.status}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3">
            <LeaveDetailsMainInfo
              leaveTypeName={detail.leaveTypeName}
              requestedDate={detail.createdAt}
              startDate={detail.startDate}
              endDate={detail.endDate}
              durationDays={detail.totalDays}
              reason={detail.reason ?? ""}
              attachments={detail.attachments}
              supervisor={detail.supervisor ?? undefined}
            />

            <LeaveDetailsApprovalSidebar
              approvals={detail.approvals}
              status={detail.status}
              quota={detail.quota ?? undefined}
              activities={activities}
            />
          </div>
        </Card>

        <LeaveDetailsActions
          leaveId={detail.leaveId}
          status={detail.status}
          leaveTypeName={detail.leaveTypeName}
          startDate={detail.startDate}
          endDate={detail.endDate}
          durationDays={detail.totalDays}
          reason={detail.reason ?? ""}
          onPrint={() => window.print()}
          onCancel={handleCancel}
          isCancelling={cancelling}
        />
      </main>
    </div>
  );
}
