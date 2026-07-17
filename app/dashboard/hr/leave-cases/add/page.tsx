"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, CaseSensitive } from "lucide-react";
import { LeaveCaseForm } from "@/components/hr/leave-cases/LeaveCaseForm";
import type { CreateLeaveCaseValues, UpdateLeaveCaseValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function AddLeaveCasePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hr/leave-types");
        if (!res.ok) throw new Error("Failed to load leave types");
        const json = await res.json();
        setLeaveTypeOptions(json.data.map((lt: { leaveTypeId: string; leaveTypeName: string }) => ({
          id: lt.leaveTypeId,
          label: lt.leaveTypeName,
        })));
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
      }
    }
    load();
  }, []);

  const onSubmit = async (values: CreateLeaveCaseValues | UpdateLeaveCaseValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/hr/leave-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      setSuccess(true);
      toast.success("เพิ่มกรณีการลาเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/leave-cases"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

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
                  { label: "เพิ่มกรณีการลา" },
                ]}
              />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <CaseSensitive className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">เพิ่มกรณีการลา</h2>
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
                mode="create"
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
