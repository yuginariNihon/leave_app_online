"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CaseSensitive } from "lucide-react";
import { LeaveCaseForm } from "@/components/hr/leave-cases/LeaveCaseForm";
import type { CreateLeaveCaseValues, UpdateLeaveCaseValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function AddLeaveCasePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const json = await apiFetch<{ data: { leaveTypeId: string; leaveTypeName: string }[] }>("/api/hr/leave-types");
        setLeaveTypeOptions(json.data.map((lt) => ({
          id: lt.leaveTypeId,
          label: lt.leaveTypeName,
        })));
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
      }
    }
    load();
  }, []);

  const onSubmit = async (values: CreateLeaveCaseValues | UpdateLeaveCaseValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch("/api/hr/leave-cases", {
        method: "POST",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("เพิ่มกรณีการลาเรียบร้อยแล้ว");
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
        { label: "เพิ่มกรณีการลา" },
      ]}
      title="เพิ่มกรณีการลา"
      icon={CaseSensitive}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <LeaveCaseForm
        mode="create"
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
