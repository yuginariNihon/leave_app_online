"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { DepartmentForm } from "@/components/hr/departments/DepartmentForm";
import type { CreateDepartmentValues, UpdateDepartmentValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddDepartmentPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: CreateDepartmentValues | UpdateDepartmentValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/departments", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มแผนกเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/departments"), 1500);
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
        { label: "จัดการแผนก", href: "/dashboard/hr/departments" },
        { label: "เพิ่มแผนก" },
      ]}
      title="เพิ่มแผนก"
      icon={Building2}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <DepartmentForm
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
