"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { UserCog } from "lucide-react";
import { EmploymentTypeForm } from "@/components/hr/employee-types/EmploymentTypeForm";
import type { CreateEmploymentTypeValues, UpdateEmploymentTypeValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function EditEmployeeTypePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeTypeId = searchParams.get("employeeTypeId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ code: string; name: string; thainame?: string | null; description?: string | null } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!employeeTypeId) return;
    async function load() {
      try {
        const json = await apiFetch<{ data: { code: string; name: string; thainame?: string | null; description?: string | null } }>(`/api/hr/employee-types/${employeeTypeId}`);
        setDefaultValues({
          code: json.data.code,
          name: json.data.name,
          thainame: json.data.thainame,
          description: json.data.description,
        });
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลประเภทพนักงานได้");
        router.push("/dashboard/hr/employee-types");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeTypeId, router]);

  const onSubmit = async (values: CreateEmploymentTypeValues | UpdateEmploymentTypeValues) => {
    if (!employeeTypeId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch(`/api/hr/employee-types/${employeeTypeId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขประเภทพนักงานเรียบร้อยแล้ว");
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
        { label: "แก้ไขประเภทพนักงาน" },
      ]}
      title="แก้ไขประเภทพนักงาน"
      icon={UserCog}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <EmploymentTypeForm
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
