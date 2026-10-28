"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import { SectionForm } from "@/components/hr/sections/SectionForm";
import type { CreateSectionValues, UpdateSectionValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddSectionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: CreateSectionValues | UpdateSectionValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/sections", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มส่วนงานเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/sections"), 1500);
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
        { label: "จัดการส่วนงาน", href: "/dashboard/hr/sections" },
        { label: "เพิ่มส่วนงาน" },
      ]}
      title="เพิ่มส่วนงาน"
      icon={Layers}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <SectionForm
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
