"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Tags } from "lucide-react";
import { LeaveTypeForm } from "@/components/hr/leave-types/LeaveTypeForm";
import type { CreateLeaveTypeValues, UpdateLeaveTypeValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

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
        const json = await apiFetch<{ data: { leaveTypeName: string; maxDaysPerYear?: number | null; isPaid?: boolean; requiresAttachment?: boolean } }>(`/api/hr/leave-types/${leaveTypeId}`);
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
      await apiFetch(`/api/hr/leave-types/${leaveTypeId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขประเภทการลาเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/leave-types"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <EntityFormPage
      breadcrumb={[
        { label: "Home", href: "/dashboard" },
        { label: "HR", href: "/dashboard/hr" },
        { label: "จัดการประเภทการลา", href: "/dashboard/hr/leave-types" },
        { label: "แก้ไขประเภทการลา" },
      ]}
      title="แก้ไขประเภทการลา"
      icon={Tags}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <LeaveTypeForm
        mode="edit"
        defaultValues={defaultValues}
        isSubmitting={submitting}
        isSuccess={success}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
      />
    </EntityFormPage>
  );
}
