"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Tags } from "lucide-react";
import { LeaveTypeForm } from "@/components/hr/leave-types/LeaveTypeForm";
import type { CreateLeaveTypeValues, UpdateLeaveTypeValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function EditLeaveTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveTypeId = searchParams.get("leaveTypeId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ leaveTypeName: string; maxDaysPerYear?: number | null; isPaid?: boolean; requiresAttachment?: boolean } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!leaveTypeId) return;
    async function load() {
      try {
        const res = await fetch(`/api/hr/leave-types/${leaveTypeId}`);
        if (!res.ok) throw new Error("Failed to load leave type");
        const json = await res.json();
        setDefaultValues({
          leaveTypeName: json.data.leaveTypeName,
          maxDaysPerYear: json.data.maxDaysPerYear,
          isPaid: json.data.isPaid,
          requiresAttachment: json.data.requiresAttachment,
        });
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
        router.push("/dashboard/hr/leave-types");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leaveTypeId, router]);

  const onSubmit = async (values: CreateLeaveTypeValues | UpdateLeaveTypeValues) => {
    if (!leaveTypeId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/hr/leave-types/${leaveTypeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      setSuccess(true);
      toast.success("แก้ไขประเภทการลาเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/leave-types"), 1500);
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
                  { label: "จัดการประเภทการลา", href: "/dashboard/hr/leave-types" },
                  { label: "แก้ไขประเภทการลา" },
                ]}
              />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <Tags className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">แก้ไขประเภทการลา</h2>
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
              <LeaveTypeForm
                mode="edit"
                defaultValues={defaultValues}
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
