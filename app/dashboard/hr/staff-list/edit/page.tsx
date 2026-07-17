"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { StaffForm } from "@/components/hr/StaffForm";
import type { StaffMasterData, StaffDetailData, LeaveRightItem } from "@/lib/services/leaveService";
import type { UpdateStaffValues } from "@/lib/TypeSchema";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function EditStaffPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get("id");

  const [masterData, setMasterData] = useState<StaffMasterData | null>(null);
  const [detail, setDetail] = useState<StaffDetailData | null>(null);
  const [quota, setQuota] = useState<LeaveRightItem[]>([]);
  const [editableQuota, setEditableQuota] = useState<Record<string, { usedDays: number; maxDays: number }>>({});
  const [quotaSaving, setQuotaSaving] = useState(false);
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
        const [masterRes, detailRes, quotaRes] = await Promise.all([
          fetch("/api/hr/master-data"),
          fetch(`/api/hr/staff/${staffId}`),
          fetch(`/api/hr/staff/${staffId}/leave-quota`),
        ]);

        if (!masterRes.ok) throw new Error("Failed to load master data");
        if (!detailRes.ok) throw new Error("Failed to load staff detail");

        const masterJson = await masterRes.json();
        const detailJson = await detailRes.json();

        setMasterData(masterJson.data);
        setDetail(detailJson.data);

        if (quotaRes.ok) {
          const quotaJson = await quotaRes.json();
          const qdata = quotaJson.data ?? [];
          setQuota(qdata);
          const map: Record<string, { usedDays: number; maxDays: number }> = {};
          for (const item of qdata) {
            map[item.leaveTypeId] = { usedDays: item.usedDays, maxDays: item.maxDays };
          }
          setEditableQuota(map);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [staffId]);

  const handleSaveQuota = async () => {
    if (!staffId) return;
    setQuotaSaving(true);
    try {
      const quotas = Object.entries(editableQuota).map(([leaveTypeId, vals]) => ({
        leaveTypeId,
        maxDays: vals.maxDays,
        usedDays: vals.usedDays,
      }));
      const res = await fetch(`/api/hr/staff/${staffId}/leave-quota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotas }),
      });
      if (!res.ok) throw new Error("Failed to save quota");
      toast.success("อัปเดตสิทธิ์ลาคงเหลือเรียบร้อยแล้ว");
      const refetch = await fetch(`/api/hr/staff/${staffId}/leave-quota`);
      if (refetch.ok) {
        const json = await refetch.json();
        setQuota(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setQuotaSaving(false);
    }
  };

  const onSubmit = async (values: UpdateStaffValues) => {
    if (!staffId) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch(`/api/hr/staff/${staffId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update");

      toast.success("แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
      setSuccess(true);
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unknown error");
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

            {/* Leave Quota Section */}
            <div className="mt-8 bg-white rounded-2xl border border-[#c6c6cd]/30 overflow-hidden p-8"
              style={{ boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[#0F172A]">
                  สิทธิ์ลาคงเหลือ ({new Date().getFullYear()})
                </h3>
                <Button
                  type="button"
                  disabled={quotaSaving}
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-[#0F172A] text-white hover:bg-[#1E293B]"
                  onClick={handleSaveQuota}
                >
                  {quotaSaving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />กำลังบันทึก...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 mr-1.5" />บันทึกสิทธิ์ลา</>
                  )}
                </Button>
              </div>
              {quota.length === 0 ? (
                <p className="text-sm text-[#45464d]">ไม่มีข้อมูลสิทธิลา</p>
              ) : (
                <div className="space-y-4">
                  {quota.map((item) => {
                    const val = editableQuota[item.leaveTypeId] ?? { usedDays: item.usedDays, maxDays: item.maxDays };
                    const percent = val.maxDays > 0 ? (val.usedDays / val.maxDays) * 100 : 0;
                    return (
                      <div key={item.leaveTypeId}>
                        <div className="flex justify-between text-sm mb-1 items-center">
                          <span className="font-medium text-[#0F172A]">
                            {item.leaveTypeName}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              className="w-[70px] h-8 text-center rounded-lg border border-[#c6c6cd] text-sm outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
                              value={val.usedDays}
                              onChange={(e) => {
                                const v = Math.max(0, Number(e.target.value) || 0);
                                setEditableQuota((prev) => ({
                                  ...prev,
                                  [item.leaveTypeId]: { ...prev[item.leaveTypeId], usedDays: v },
                                }));
                              }}
                            />
                            <span className="text-[#45464d]">/</span>
                            <input
                              type="number"
                              min={0}
                              className="w-[70px] h-8 text-center rounded-lg border border-[#c6c6cd] text-sm outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
                              value={val.maxDays}
                              onChange={(e) => {
                                const v = Math.max(0, Number(e.target.value) || 0);
                                setEditableQuota((prev) => ({
                                  ...prev,
                                  [item.leaveTypeId]: { ...prev[item.leaveTypeId], maxDays: v },
                                }));
                              }}
                            />
                            <span className="text-[#45464d]">วัน</span>
                          </div>
                        </div>
                        <Progress
                          value={percent}
                          className="h-2 bg-[#eff4ff]"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

