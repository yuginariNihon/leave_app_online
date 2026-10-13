"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { StaffForm } from "@/components/hr/StaffForm";
import type { StaffMasterData, StaffDetailData } from "@/lib/services/leaveService";
import type { UpdateStaffValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { apiFetch } from "@/lib/api";

export default function EditStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get("id");

  const [masterData, setMasterData] = useState<StaffMasterData | null>(null);
  const [detail, setDetail] = useState<StaffDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!staffId) return;

    async function load() {
      setLoading(true);
      try {
const [masterJson, detailJson] = await Promise.all([
          apiFetch<{ data: StaffMasterData }>("/api/hr/master-data"),
          apiFetch<{ data: StaffDetailData }>(`/api/hr/staff/${staffId}`),
        ]);

        setMasterData(masterJson.data);
        setDetail(detailJson.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [staffId]);

  const onSubmit = async (values: UpdateStaffValues) => {
    if (!staffId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
await apiFetch(`/api/hr/staff/${staffId}`, {
        method: "PUT",
        body: JSON.stringify(values),
      });

      toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  if (!staffId) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#45464d] text-sm">ไม่พบรหัสพนักงาน</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-[#45464d] text-sm">กำลังโหลด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {submitting && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1a1a40]" />
            <p className="font-bold text-[#1a1a40]">กำลังบันทึก...</p>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <section className="flex-1 px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb
                className="mb-6"
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "HR", href: "/dashboard/hr" },
                  { label: "Staff List", href: "/dashboard/hr/staff-list" },
                  { label: "Edit" },
                ]}
              />

            <StaffForm
              mode="edit"
              masterData={masterData}
              onSubmit={onSubmit}
              defaultValues={detail ? {
                name: detail.name,
                departmentId: detail.departmentId,
                positionId: detail.positionId,
                sectionId: detail.sectionId || undefined,
                employmentTypeId: detail.employmentTypeId || undefined,
                phoneNumber: detail.phoneNumber || undefined,
                email: detail.email || undefined,
                dateOfBirth: detail.dateOfBirth || undefined,
                startDate: detail.startDate || undefined,
                employmentStatus: detail.employmentStatus as "active" | "inactive" | "terminated",
              } : undefined}
              staffCode={detail?.staffCode}
              isSubmitting={submitting}
              isSuccess={success}
              submitError={submitError}
              onCancel={() => router.back()}
              onBack={() => router.back()}
            />

            <div className="mt-8 flex items-center justify-between rounded-2xl border border-[#c6c6cd]/30 bg-white p-6">
              <div>
                <h3 className="text-base font-semibold text-[#0F172A]">สิทธิ์การลา</h3>
                <p className="mt-0.5 text-sm text-[#45464d]">
                  จัดการจำนวนวันและเปิด/ปิดสิทธิ์การลาได้ที่หน้าจัดการสิทธิ์การลา
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/hr/staff-list/leave-quota?id=${staffId}`)}
                className="shrink-0 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E293B]"
              >
                จัดการสิทธิ์การลา
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

