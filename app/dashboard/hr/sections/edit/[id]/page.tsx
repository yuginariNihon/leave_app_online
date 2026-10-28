"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Layers } from "lucide-react";
import { SectionForm } from "@/components/hr/sections/SectionForm";
import type { CreateSectionValues, UpdateSectionValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function EditSectionPage() {
  const router = useRouter();
  const params = useParams();
  const sectionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ sectionCode: string; sectionName: string; departmentId: string } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!sectionId) return;
    async function load() {
      try {
        const json = await apiFetch<{ data: { sectionCode: string; sectionName: string; departmentId: string } }>(`/api/hr/sections/${sectionId}`);
        setDefaultValues({
          sectionCode: json.data.sectionCode,
          sectionName: json.data.sectionName,
          departmentId: json.data.departmentId,
        });
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลส่วนงานได้");
        router.push("/dashboard/hr/sections");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sectionId, router]);

  const onSubmit = async (values: CreateSectionValues | UpdateSectionValues) => {
    if (!sectionId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch(`/api/hr/sections/${sectionId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขส่วนงานเรียบร้อยแล้ว");
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
        { label: "แก้ไขส่วนงาน" },
      ]}
      title="แก้ไขส่วนงาน"
      icon={Layers}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <SectionForm
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
