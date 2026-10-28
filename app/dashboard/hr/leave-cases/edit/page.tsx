"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CaseSensitive } from "lucide-react";
import { LeaveCaseForm } from "@/components/hr/leave-cases/LeaveCaseForm";
import type { CreateLeaveCaseValues, UpdateLeaveCaseValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function EditLeaveCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leaveCaseId = searchParams.get("leaveCaseId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ leaveTypeId: string; caseName: string } | undefined>();
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<{ id: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [typesJson, caseJson] = await Promise.all([
          apiFetch<{ data: { leaveTypeId: string; leaveTypeName: string }[] }>("/api/hr/leave-types"),
          leaveCaseId ? apiFetch<{ data: { leaveTypeId: string; caseName: string } }>(`/api/hr/leave-cases/${leaveCaseId}`) : Promise.resolve(null),
        ]);

        setLeaveTypeOptions(typesJson.data.map((lt) => ({
          id: lt.leaveTypeId,
          label: lt.leaveTypeName,
        })));

        if (caseJson) {
          setDefaultValues({
            leaveTypeId: caseJson.data.leaveTypeId,
            caseName: caseJson.data.caseName,
          });
        }
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลกรณีการลาได้");
        router.push("/dashboard/hr/leave-cases");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [leaveCaseId, router]);

  const onSubmit = async (values: CreateLeaveCaseValues | UpdateLeaveCaseValues) => {
    if (!leaveCaseId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch(`/api/hr/leave-cases/${leaveCaseId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขกรณีการลาเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/leave-cases"), 1500);
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
        { label: "จัดการกรณีการลา", href: "/dashboard/hr/leave-cases" },
        { label: "แก้ไขกรณีการลา" },
      ]}
      title="แก้ไขกรณีการลา"
      icon={CaseSensitive}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <LeaveCaseForm
        mode="edit"
        defaultValues={defaultValues}
        leaveTypeOptions={leaveTypeOptions}
        isSubmitting={submitting}
        isSuccess={success}
        submitError={submitError}
        onSubmit={onSubmit}
        onCancel={() => router.back()}
      />
    </EntityFormPage>
  );
}
