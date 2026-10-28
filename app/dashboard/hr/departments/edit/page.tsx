"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { DepartmentForm } from "@/components/hr/departments/DepartmentForm";
import type { CreateDepartmentValues, UpdateDepartmentValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function EditDepartmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentId = searchParams.get("departmentId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ departmentCode: string; departmentName: string } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!departmentId) return;
    async function load() {
      try {
        const json = await apiFetch<{ data: { departmentCode: string; departmentName: string } }>(`/api/hr/departments/${departmentId}`);
        setDefaultValues({
          departmentCode: json.data.departmentCode,
          departmentName: json.data.departmentName,
        });
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลแผนกได้");
        router.push("/dashboard/hr/departments");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [departmentId, router]);

  const onSubmit = async (values: CreateDepartmentValues | UpdateDepartmentValues) => {
    if (!departmentId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch(`/api/hr/departments/${departmentId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขแผนกเรียบร้อยแล้ว");
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
        { label: "แก้ไขแผนก" },
      ]}
      title="แก้ไขแผนก"
      icon={Building2}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <DepartmentForm
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
