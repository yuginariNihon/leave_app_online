"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StaffForm } from "@/components/hr/StaffForm";
import type { StaffMasterData } from "@/lib/services/leaveService";
import type { CreateStaffValues, UpdateStaffValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function AddStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetDept = searchParams.get("departmentId");

  const [masterData, setMasterData] = useState<StaffMasterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hr/master-data");
        if (!res.ok) throw new Error("Failed to load master data");
        const json = await res.json();
        setMasterData(json.data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const onSubmit = async (values: CreateStaffValues | UpdateStaffValues) => {
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/hr/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create staff");

      toast.success("เพิ่มรายชื่อพนักงานเรียบร้อยแล้ว");
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/hr/staff-list"), 1500);
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
                  { label: "Staff List", href: "/dashboard/hr/staff-list" },
                  { label: "Add" },
                ]}
              />

            <StaffForm
              mode="create"
              masterData={masterData}
              onSubmit={onSubmit}
              isSubmitting={submitting}
              isSuccess={success}
              submitError={submitError}
              onCancel={() => router.back()}
              onBack={() => router.back()}
              defaultValues={{
                staffCode: "",
                name: "",
                departmentId: presetDept || "",
                positionId: "",
                sectionId: "",
                employmentTypeId: "",
                phoneNumber: "",
                email: "",
                dateOfBirth: "",
                startDate: "",
                employmentStatus: "active",
              }}
            />
        </div>
      </section>
      </main>
    </div>
  );
}
