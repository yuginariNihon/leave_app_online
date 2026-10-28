"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import { PositionForm } from "@/components/hr/positions/PositionForm";
import type { CreatePositionValues, UpdatePositionValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddPositionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const onSubmit = async (values: CreatePositionValues | UpdatePositionValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/positions", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มตำแหน่งเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/positions"), 1500);
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
        { label: "จัดการตำแหน่ง", href: "/dashboard/hr/positions" },
        { label: "เพิ่มตำแหน่ง" },
      ]}
      title="เพิ่มตำแหน่ง"
      icon={Briefcase}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <PositionForm
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
