"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Briefcase } from "lucide-react";
import { PositionForm } from "@/components/hr/positions/PositionForm";
import type { CreatePositionValues, UpdatePositionValues } from "@/lib/TypeSchema";
import { EntityFormPage } from "@/components/shared/EntityFormPage";
import { apiFetch } from "@/lib/api";

export default function EditPositionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const positionId = searchParams.get("positionId");

  const [loading, setLoading] = useState(true);
  const [defaultValues, setDefaultValues] = useState<{ positionName: string; positionLevel?: number | null } | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!positionId) return;
    async function load() {
      try {
        const json = await apiFetch<{ data: { positionName: string; positionLevel?: number | null } }>(`/api/hr/positions/${positionId}`);
        setDefaultValues({
          positionName: json.data.positionName,
          positionLevel: json.data.positionLevel,
        });
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
        router.push("/dashboard/hr/positions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [positionId, router]);

  const onSubmit = async (values: CreatePositionValues | UpdatePositionValues) => {
    if (!positionId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      await apiFetch(`/api/hr/positions/${positionId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      setSuccess(true);
      toast.success("แก้ไขตำแหน่งเรียบร้อยแล้ว");
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
        { label: "แก้ไขตำแหน่ง" },
      ]}
      title="แก้ไขตำแหน่ง"
      icon={Briefcase}
      loading={loading}
      isSubmitting={submitting}
      onBack={() => router.back()}
    >
      <PositionForm
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
