"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, ShieldCheck, Info, ArrowLeft, BadgeInfo } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { StaffDetailData, LeaveRightItem } from "@/lib/services/leaveService";

type EditableRow = {
  leaveTypeId: string;
  leaveTypeName: string;
  maxDays: number;
  usedDays: number;
  isActive: boolean;
};

function Toggle({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#4648d4]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function toEditable(items: LeaveRightItem[]): EditableRow[] {
  return items.map((r) => ({
    leaveTypeId: r.leaveTypeId,
    leaveTypeName: r.leaveTypeName,
    maxDays: r.maxDays,
    usedDays: r.usedDays,
    isActive: r.isActive,
  }));
}

export default function StaffLeaveQuotaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const staffId = searchParams.get("id");

  const [staffName, setStaffName] = useState("");
  const [staffCode, setStaffCode] = useState("");
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [original, setOriginal] = useState<EditableRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = new Date().getFullYear();

  useEffect(() => {
    if (!staffId) return;

    async function load() {
      setLoading(true);
      try {
        const [detailJson, quotaJson] = await Promise.all([
          apiFetch<{ data: StaffDetailData }>(`/api/hr/staff/${staffId}`),
          apiFetch<{ data: LeaveRightItem[] }>(`/api/hr/staff/${staffId}/leave-quota`),
        ]);
        setStaffName(detailJson.data.name);
        setStaffCode(detailJson.data.staffCode);
        const editable = toEditable(quotaJson.data ?? []);
        setRows(editable);
        setOriginal(editable);
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [staffId]);

  const setRow = (leaveTypeId: string, patch: Partial<EditableRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.leaveTypeId === leaveTypeId ? { ...r, ...patch } : r)),
    );
  };

  const dirty = JSON.stringify(rows) !== JSON.stringify(original);
  const invalid = rows.some((r) => r.usedDays > r.maxDays);

  const handleSave = async () => {
    if (!staffId || !dirty || invalid) return;
    setSaving(true);
    try {
      await apiFetch(`/api/hr/staff/${staffId}/leave-quota`, {
        method: "PUT",
        body: JSON.stringify({
          quotas: rows.map((r) => ({
            leaveTypeId: r.leaveTypeId,
            maxDays: r.maxDays,
            usedDays: r.usedDays,
            isActive: r.isActive,
          })),
        }),
      });
      const refetch = await apiFetch<{ data: LeaveRightItem[] }>(
        `/api/hr/staff/${staffId}/leave-quota`,
      ).catch(() => null);
      const editable = refetch ? toEditable(refetch.data ?? []) : rows;
      setRows(editable);
      setOriginal(editable);
      toast.success("บันทึกสิทธิ์การลาเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ไม่สามารถบันทึกสิทธิ์การลาได้");
    } finally {
      setSaving(false);
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

  const activeCount = rows.filter((r) => r.isActive).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {saving && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8FAFC]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-[#1a1a40]" />
            <p className="font-bold text-[#1a1a40]">กำลังบันทึก...</p>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto">
        <section className="px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb
              className="mb-6"
              items={[
                { label: "Home", href: "/dashboard" },
                { label: "HR", href: "/dashboard/hr" },
                { label: "Staff List", href: "/dashboard/hr/staff-list" },
                { label: "จัดการสิทธิ์การลา" },
              ]}
            />

            <div
              className="bg-white rounded-2xl border border-[#c6c6cd]/30 overflow-hidden"
              style={{ boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)" }}
            >
              <div className="bg-[#0F172A] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-row gap-3 items-center">
                  <div className="flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center backdrop-blur-md">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[28px] md:text-[32px] font-semibold text-white leading-9 md:leading-10 tracking-[-0.01em] mb-1">
                      จัดการสิทธิ์การลา
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {(staffName || staffCode) && (
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full">
                          <BadgeInfo className="w-3.5 h-3.5 text-[#dae2fd]" />
                          <span className="text-sm font-semibold text-[#dae2fd] tracking-wide">
                            {staffName}
                            {staffCode ? ` · ${staffCode}` : ""}
                          </span>
                        </div>
                      )}
                      <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full">
                        <span className="text-sm font-semibold text-[#dae2fd] tracking-wide">
                          ปี {year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-white hover:text-[#100d41] rounded-lg bg-white/15 hover:bg-white/30"
                    onClick={() => router.push("/dashboard/hr/staff-list")}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">ย้อนกลับ</span>
                  </Button>
                </div>
              </div>

              <div className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                  <p className="flex items-center gap-1.5 text-xs text-[#787680]">
                    <Info className="w-3.5 h-3.5" />
                    แก้จำนวนวัน (ใช้ไป / โควตา) และสวิตช์เปิด-ปิดสิทธิ์ได้ — สิทธิ์ที่ปิดจะไม่แสดงต่อพนักงาน
                  </p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#1b0088]">
                    เปิดใช้งาน {activeCount}/{rows.length}
                  </span>
                </div>
              

              <div className="mt-6 divide-y divide-[#eef0f6]">
                {rows.length === 0 && (
                  <p className="py-6 text-sm text-[#45464d]">ไม่มีข้อมูลสิทธิลา</p>
                )}
                {rows.map((row) => {
                  const remaining = row.maxDays - row.usedDays;
                  const rowInvalid = row.usedDays > row.maxDays;
                  return (
                    <div
                      key={row.leaveTypeId}
                      className={`flex flex-col gap-3 py-4 transition-opacity sm:flex-row sm:items-center sm:justify-between ${
                        row.isActive ? "" : "opacity-60"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#0F172A]">
                          {row.leaveTypeName}
                        </p>
                        <p className="mt-0.5 text-xs text-[#787680]">
                          เหลือ{" "}
                          <span className={`font-semibold ${remaining < 0 ? "text-red-500" : "text-[#4648d4]"}`}>
                            {remaining.toFixed(2)}
                          </span>{" "}
                          วัน
                          {rowInvalid && (
                            <span className="ml-2 font-semibold text-red-500">
                              ใช้ไปเกินโควตา
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            aria-label="ใช้ไป (วัน)"
                            className="w-[70px] h-8 text-center rounded-lg border border-[#c6c6cd] text-sm outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
                            value={row.usedDays}
                            onChange={(e) =>
                              setRow(row.leaveTypeId, {
                                usedDays: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                          <span className="text-[#45464d]">/</span>
                          <input
                            type="number"
                            min={0}
                            aria-label="โควตา (วัน)"
                            className="w-[70px] h-8 text-center rounded-lg border border-[#c6c6cd] text-sm outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.1)]"
                            value={row.maxDays}
                            onChange={(e) =>
                              setRow(row.leaveTypeId, {
                                maxDays: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                          />
                          <span className="text-[#45464d]">วัน</span>
                        </div>

                        <div className="flex items-center gap-2 border-l border-[#eef0f6] pl-3">
                          <span
                            className={`hidden text-xs font-semibold md:inline ${
                              row.isActive ? "text-emerald-600" : "text-gray-400"
                            }`}
                          >
                            {row.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                          </span>
                          <Toggle
                            checked={row.isActive}
                            onCheckedChange={(next) =>
                              setRow(row.leaveTypeId, { isActive: next })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="justify-end mt-6 flex items-center gap-3 border-t border-[#eef0f6] pt-5">
                <Button
                  type="button"
                  disabled={!dirty || invalid || saving}
                  className="h-9 px-4 text-xs font-semibold rounded-lg bg-[#0F172A] text-white hover:bg-[#1E293B] disabled:opacity-40"
                  onClick={handleSave}
                >
                  {saving ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />กำลังบันทึก...</>
                  ) : (
                    <><Save className="w-3.5 h-3.5 mr-1.5" />บันทึกสิทธิ์การลา</>
                  )}
                </Button>
                {dirty && (
                  <button
                    type="button"
                    disabled={saving}
                    className="text-sm font-semibold text-[#787680] hover:underline disabled:opacity-40"
                    onClick={() => setRows(original)}
                  >
                    ยกเลิกการแก้ไข
                  </button>
                )}
              </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}