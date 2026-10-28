"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { EmploymentTypeForm } from "@/components/hr/employee-types/EmploymentTypeForm";
import type { CreateEmploymentTypeValues, UpdateEmploymentTypeValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddEmployeeTypePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: CreateEmploymentTypeValues | UpdateEmploymentTypeValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/employee-types", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มประเภทพนักงานเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/employee-types"), 1500);
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
        { label: "จัดการประเภทพนักงาน", href: "/dashboard/hr/employee-types" },
        { label: "เพิ่มประเภทพนักงาน" },
      ]}
      title="เพิ่มประเภทพนักงาน"
      icon={UserCog}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <EmploymentTypeForm
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
