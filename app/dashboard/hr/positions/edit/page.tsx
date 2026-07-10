"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Briefcase } from "lucide-react";
import { PositionForm } from "@/components/hr/positions/PositionForm";
import type { CreatePositionValues, UpdatePositionValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

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
        const res = await fetch(`/api/hr/positions/${positionId}`);
        if (!res.ok) throw new Error("Failed to load position");
        const json = await res.json();
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
      const res = await fetch(`/api/hr/positions/${positionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      setSuccess(true);
      toast.success("แก้ไขตำแหน่งเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/positions"), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#45464d] text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <section className="flex-1 px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb
                className="mb-6"
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "HR", href: "/dashboard/hr" },
                  { label: "จัดการตำแหน่ง", href: "/dashboard/hr/positions" },
                  { label: "แก้ไขตำแหน่ง" },
                ]}
              />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <Briefcase className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">แก้ไขตำแหน่ง</h2>
                </div>
                <div className="">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-white hover:text-[#100d41]"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    ย้อนกลับ
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white border-x border-b border-slate-200 p-8 shadow-sm rounded-b-2xl">
              <PositionForm
                mode="edit"
                defaultValues={defaultValues}
                isSubmitting={submitting}
                isSuccess={success}
                submitError={submitError}
                onSubmit={onSubmit}
                onCancel={() => router.back()}
              />
            </div>
        </div>
      </section>
      </main>
    </div>
  );
}
