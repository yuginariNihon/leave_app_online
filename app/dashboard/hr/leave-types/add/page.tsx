"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tags } from "lucide-react";
import { LeaveTypeForm } from "@/components/hr/leave-types/LeaveTypeForm";
import type { CreateLeaveTypeValues, UpdateLeaveTypeValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddLeaveTypePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: CreateLeaveTypeValues | UpdateLeaveTypeValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/leave-types", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มประเภทการลาเรียบร้อยแล้ว");
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
        { label: "เพิ่มประเภทการลา" },
      ]}
      title="เพิ่มประเภทการลา"
      icon={Tags}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <LeaveTypeForm
        mode="create"
        isSubmitting={submitting}
        isSuccess={success}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
      />
    </EntityFormPage>
  );
}
