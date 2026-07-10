"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CaseSensitive } from "lucide-react";
import { LeaveCaseForm } from "@/components/hr/leave-cases/LeaveCaseForm";
import type { CreateLeaveCaseValues, UpdateLeaveCaseValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function EditLeaveCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveCaseId = searchParams.get("leaveCaseId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ leaveTypeId: string; caseName: string } | undefined>();
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [typesRes, caseRes] = await Promise.all([
          fetch("/api/hr/leave-types"),
          leaveCaseId ? fetch(`/api/hr/leave-cases/${leaveCaseId}`) : Promise.resolve(null),
        ]);

        if (!typesRes.ok) throw new Error("Failed to load leave types");
        const typesJson = await typesRes.json();
        setLeaveTypeOptions(typesJson.data.map((lt: { leaveTypeId: string; leaveTypeName: string }) => ({
          id: lt.leaveTypeId,
          label: lt.leaveTypeName,
        })));

        if (caseRes) {
          if (!caseRes.ok) throw new Error("Failed to load leave case");
          const caseJson = await caseRes.json();
          setDefaultValues({
            leaveTypeId: caseJson.data.leaveTypeId,
            caseName: caseJson.data.caseName,
          });
        }
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลกรณีการลาได้");
        router.push("/dashboard/hr/leave-cases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leaveCaseId, router]);

  const onSubmit = async (values: CreateLeaveCaseValues | UpdateLeaveCaseValues) => {
    if (!leaveCaseId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/hr/leave-cases/${leaveCaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      setSuccess(true);
      toast.success("แก้ไขกรณีการลาเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/leave-cases"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#45464d] text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <section className="flex-1 px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb
                className="mb-6"
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "HR", href: "/dashboard/hr" },
                  { label: "จัดการกรณีการลา", href: "/dashboard/hr/leave-cases" },
                  { label: "แก้ไขกรณีการลา" },
                ]}
              />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <CaseSensitive className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">แก้ไขกรณีการลา</h2>
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
            </div>

            <div className="bg-white border-x border-b border-slate-200 p-8 shadow-sm rounded-b-2xl">
              <LeaveCaseForm
                mode="edit"
                defaultValues={defaultValues}
                leaveTypeOptions={leaveTypeOptions}
                isSubmitting={submitting}
                isSuccess={success}
                submitError={submitError}
                onSubmit={onSubmit}
                onCancel={() => router.back()}
              />
            </div>
        </div>
      </section>
      </main>
    </div>
  );
}
