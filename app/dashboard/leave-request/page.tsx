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
import { countInclusiveDays, currentSubmitTime } from "@/lib/utils";

import {
  LeaveForm
} from "@/components/leave-request/LeaveForm";

import { SuccessDialog } from "@/components/leave-request/SuccessDialog";
import { styleAlertTextSuccess } from "@/lib/utils";
import { leaveFormSchema, LeaveFormValues } from "@/lib/TypeSchema";
import { useLeaveOptions } from "@/hooks/useLeaveOptions";
// ⚠️ File upload — not yet implemented (hook kept for future use)
import { useFileUpload } from "@/hooks/useFileUpload";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export type LeaveQuotaMap = Record<string, { usedDays: number; maxDays: number; remaining: number }>;

export default function LeaveRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [submitTime, setSubmitTime] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [leaveQuota, setLeaveQuota] = useState<LeaveQuotaMap>({});

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

  // Fetch leave quota
  useEffect(() => {
    let cancelled = false;

    async function loadQuota() {
      try {
        const response = await fetch("/api/leave-quota");
        if (response.ok) {
          const result = await response.json();
          if (!cancelled) setLeaveQuota(result.data ?? {});
        }
      } catch {
        // quota is optional, fail silently
      }
    }

    loadQuota();

    return () => {
      cancelled = true;
    };
  }, []);

  // Watch form values
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const leaveTypeId = form.watch("leaveTypeId");

  // Calculate leave days
  const dayCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countInclusiveDays(startDate, endDate);
  }, [startDate, endDate]);

  // Check if requested days exceed remaining quota
  const totalRemaining = leaveTypeId ? leaveQuota[leaveTypeId]?.remaining ?? Infinity : Infinity;
  const isQuotaExceeded = dayCount > 0 && totalRemaining < Infinity && dayCount > totalRemaining;

  // Prefill when editing
  useEffect(() => {
    if (!searchParams) return;

    const edit = searchParams.get("edit");

    if (edit === "true") {
      const leaveTypeId = searchParams.get("leaveTypeId");
      const leaveCaseId = searchParams.get("leaveCaseId");
      const start = searchParams.get("start");
      const end = searchParams.get("end");
      const reason = searchParams.get("reason");

      if (leaveTypeId) form.setValue("leaveTypeId", leaveTypeId);
      if (leaveCaseId) form.setValue("leaveCaseId", leaveCaseId);
      if (start) form.setValue("startDate", start);
      if (end) form.setValue("endDate", end);
      if (reason) form.setValue("reason", reason);
    }
  }, [searchParams, form]);

  // Submit form
  const handleSubmit = async (values: LeaveFormValues) => {
    setSubmitError("");

    // Validate quota before submitting
    const quota = leaveQuota[values.leaveTypeId];
    if (quota && dayCount > quota.remaining) {
      setSubmitError(
        `วันลาที่ขอ (${dayCount} วัน) เกินจำนวนวันที่เหลืออยู่ (${quota.remaining} วัน) สำหรับประเภทการลานี้`
      );
      return;
    }

    setSubmitTime(currentSubmitTime());
    const response = await fetch("/api/leaves", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leaveTypeId: values.leaveTypeId,
        leaveCaseId: values.leaveCaseId,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
        totalDays: dayCount,
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);

      setSubmitError(
        result?.error ?? "Unable to submit leave request. Please try again.",
      );
      return;
    }

    setShowSuccessDialog(true);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "Leave Request" }]}
          className="mb-4"
        />

        <Card className="p-0 overflow-hidden border-none shadow-xl rounded-xl">
          <CardHeader className="bg-[#100d41] text-white px-6 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-3">
                <CalendarDays className="w-6 h-6" />
                <CardTitle className="text-xl font-medium tracking-wide">
                  ยื่นใบลา
                </CardTitle>
              </div>
              <div className="">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-white hover:text-[#100d41]"
                  onClick={() => router.back()}
                >
                  <ArrowLeft className="w-4 h-4" />
                  ย้อนกลับ
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="relative p-6 md:p-10 bg-white min-h-[600px]">
            {/* Background Decorative Hexagons */}
            <div
              aria-hidden="true"
              className="absolute inset-0 overflow-hidden pointer-events-none"
            >
              <div className="absolute -top-20 -right-20 opacity-[0.08] text-[#100d41] rotate-12">
                <svg
                  fill="currentColor"
                  height="400"
                  viewBox="0 0 100 100"
                  width="400"
                >
                  <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"></path>
                </svg>
              </div>

              <div className="absolute top-1/2 -left-32 opacity-[0.05] text-[#100d41] -translate-y-1/2 -rotate-12">
                <svg
                  fill="currentColor"
                  height="500"
                  viewBox="0 0 100 100"
                  width="500"
                >
                  <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"></path>
                </svg>
              </div>

              <div className="absolute -bottom-24 -right-24 opacity-[0.06] text-[#100d41] rotate-45">
                <svg
                  fill="currentColor"
                  height="350"
                  viewBox="0 0 100 100"
                  width="350"
                >
                  <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"></path>
                </svg>
              </div>
            </div>

            {optionsError && (
              <p className="relative z-10 mb-6 text-sm font-medium text-red-600">
                {optionsError}
              </p>
            )}

            <LeaveForm
              form={form}
              leaveTypeOptions={leaveTypeOptions}
              leaveCaseOptions={leaveCaseOptions}
              leaveQuota={leaveQuota}
              isQuotaExceeded={isQuotaExceeded}
              optionsLoading={optionsLoading}
              dayCount={dayCount}
              fileName={fileName}
              fileError={uploadFileError}
              onFileChange={handleFileChange}
              onSubmit={handleSubmit}
            />
          </CardContent>

          <CardFooter className="bg-slate-50 px-6 py-6 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4">
            {submitError && (
              <p className="w-full text-sm font-medium text-red-600 md:mr-auto md:w-auto">
                {submitError}
              </p>
            )}
            <Button
              variant="outline"
              className="w-full md:w-auto px-10 h-12 border-gray-300 text-slate-600 hover:bg-white font-semibold transition-all"
              onClick={() => router.back()}
            >
              ยกเลิก
            </Button>

            <LoadingButton
              type="submit"
              form="leave-request-form"
              disabled={isQuotaExceeded}
              isLoading={form.formState.isSubmitting}
              loadingText="กำลังส่งคำขอ..."
              className="w-full md:w-auto px-10 h-12 bg-[#100d41] text-white hover:bg-[#1a1752] font-semibold shadow-lg shadow-[#100d41]/20 transition-all active:scale-95"
            >
              ส่งคำขอลา
            </LoadingButton>
          </CardFooter>
        </Card>

        <SuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          submitTime={submitTime}
          toastMessage="ยื่นคำขอลาเรียบร้อย"
          styleAlert={styleAlertTextSuccess.toString()}
        />
      </main>
    </div>
  );
}
