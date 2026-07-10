"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

import { ArrowLeft, CalendarDays } from "lucide-react";

import { SuccessDialog } from "@/components/leave-request/SuccessDialog";
import { styleAlertTextSuccess } from "@/lib/utils";
import { leaveFormSchema, LeaveFormValues } from "@/lib/TypeSchema";
import { LeaveForm } from "@/components/leave-request/LeaveForm";
import { getEditLeaveId } from "@/lib/navigation-state";
import { countInclusiveDays, currentSubmitTime, dateOnly } from "@/lib/utils";
import { useLeaveOptions } from "@/hooks/useLeaveOptions";
// ⚠️ File upload — not yet implemented (hook kept for future use)
import { useFileUpload } from "@/hooks/useFileUpload";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function EditLeavePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitTime, setSubmitTime] = useState("");
  const [leaveId, setLeaveId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdAt, setCreatedAt] = useState("");
  const [submitError, setSubmitError] = useState("");

  const { leaveTypeOptions, leaveCaseOptions, optionsLoading, optionsError } = useLeaveOptions();
  const { fileName, fileError: uploadFileError, handleFileChange } = useFileUpload();

  // React Hook Form
  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    defaultValues: {
      leaveTypeId: "",
      leaveCaseId: "",
      startDate: "",
      endDate: "",
      reason: "",
    },
  });

  // Load leave detail on mount
  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      const queryId = searchParams?.get("leaveId") ?? null;
      const id = queryId ?? getEditLeaveId();

      if (!id) {
        if (!cancelled) {
          setDetailError("ไม่พบรหัสคำขอลา");
          setDetailLoading(false);
        }
        return;
      }

      setLeaveId(id);
      setDetailLoading(true);
      setDetailError("");

      try {
        const res = await fetch(`/api/leaves/detail?leaveId=${encodeURIComponent(id)}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch leave detail");
        }

        const detail = json.data;

        if (!cancelled && detail) {
          setCreatedAt(detail.createdAt ?? "");
          form.reset({
            leaveTypeId: detail.leaveTypeId ?? "",
            leaveCaseId: detail.leaveCaseId ?? "",
            startDate: dateOnly(detail.startDate),
            endDate: dateOnly(detail.endDate),
            reason: detail.reason ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setDetailError(
            err instanceof Error ? err.message : "Failed to fetch leave detail",
          );
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, []);

  // Watch form values
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // Calculate leave days
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countInclusiveDays(startDate, endDate);
  }, [startDate, endDate]);

  // Submit
  const handleSubmit = async (values: LeaveFormValues) => {
    if (!leaveId) return;

    setSubmitError("");
    setSubmitting(true);

    setSubmitTime(currentSubmitTime());

    try {
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveTypeId: values.leaveTypeId,
          leaveCaseId: values.leaveCaseId,
          startDate: values.startDate,
          endDate: values.endDate,
          reason: values.reason,
          totalDays: dayCount,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Failed to update leave request");
      }

      setShowSuccessDialog(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to update leave request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
        <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/dashboard" },
              { label: "Leave Request", href: "/dashboard/leave-request" },
              { label: "Edit" },
            ]}
            className="mb-4"
          />
          <div className="min-h-[480px] flex items-center justify-center">
            <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
          </div>
        </main>
      </div>
    );
  }

  if (detailError || !leaveId) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
        <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
          <div className="min-h-[480px] flex flex-col items-center justify-center gap-4">
            <p className="text-red-500">{detailError ?? "ไม่พบข้อมูล"}</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/leave-history")}>
              กลับไปหน้าประวัติ
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <AppBreadcrumb
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Leave Request", href: "/dashboard/leave-request" },
            { label: "Edit" },
          ]}
          className="mb-6"
        />

        <Card className="p-0 overflow-hidden border-none shadow-xl rounded-xl">
          <CardHeader className="bg-[#100d41] text-white px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-3">
                <CalendarDays className="w-6 h-6" />
                <CardTitle className="text-xl font-medium tracking-wide">
                  แก้ไขคำขอ
                </CardTitle>
              </div>
              <div className="">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white hover:text-[#100d41]"
                  onClick={() => router.push("/dashboard/leave-history")}
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-6 md:p-10 bg-white min-h-[480px]">
            {optionsError && (
              <p className="mb-6 text-sm font-medium text-red-600">
                {optionsError}
              </p>
            )}

            {submitError && (
              <p className="mb-6 text-sm font-medium text-red-600">
                {submitError}
              </p>
            )}

            <LeaveForm
              form={form}
              leaveTypeOptions={leaveTypeOptions}
              leaveCaseOptions={leaveCaseOptions}
              optionsLoading={optionsLoading}
              dayCount={dayCount}
              fileName={fileName}
              fileError={uploadFileError}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
              createdAt={createdAt}
            />
          </CardContent>

          <CardFooter className="bg-slate-50 px-6 py-6 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4">
            <Button
              variant="outline"
              className="w-full md:w-auto px-10 h-12 border-gray-300 text-slate-600 hover:bg-white font-semibold transition-all"
              onClick={() => router.push("/dashboard/leave-history")}
              disabled={submitting}
            >
              ยกเลิก
            </Button>

            <LoadingButton
              type="submit"
              form="leave-request-form"
              className="w-full md:w-auto px-10 h-12 bg-[#100d41] text-white hover:bg-[#1a1752] font-semibold shadow-lg shadow-[#100d41]/20 transition-all active:scale-95"
              disabled={submitting}
              isLoading={submitting}
              loadingText="กำลังบันทึก..."
            >
              บันทึกการแก้ไข
            </LoadingButton>
          </CardFooter>
        </Card>

        <SuccessDialog
          open={showSuccessDialog}
          onOpenChange={(open) => {
            setShowSuccessDialog(open);
            if (!open) {
              router.push("/dashboard/leave-history");
            }
          }}
          submitTime={submitTime}
          title="ยืนยันการแก้ไขคำขอลา"
          toastMessage="บันทึกการแก้ไขคำขอลาเรียบร้อย"
          styleAlert={styleAlertTextSuccess.toString()}
        />
      </main>
    </div>
  );
}