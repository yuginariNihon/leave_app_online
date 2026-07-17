"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, GitBranch, Plus, Trash2, GripVertical, Save, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { ApproverType } from "@/lib/generated/prisma/enums";
import { HelpSection } from "@/components/hr/HelpSection";

type StepFormItem = {
  key: string;
  approverType: string;
  isRequired: boolean;
};

type PositionOption = {
  positionId: string;
  positionName: string;
  positionLevel: number | null;
};

const APPROVER_OPTIONS = Object.values(ApproverType).map((v) => ({
  value: v,
  label: v.replace(/_/g, " "),
}));

function generateKey() {
  return Math.random().toString(36).substring(2, 9);
}

export default function AddWorkflowPage() {
  const router = useRouter();

  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState("");
  const [steps, setSteps] = useState<StepFormItem[]>([
    { key: generateKey(), approverType: "Supervisor", isRequired: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/hr/workflows/available-positions");
        if (!res.ok) throw new Error("Failed to load positions");
        const json = await res.json();
        setPositions(json.data ?? []);
      } catch {
        toast.error("ไม่สามารถโหลดรายการตำแหน่งได้");
        router.push("/dashboard/hr/workflows");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const handleAddStep = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      { key: generateKey(), approverType: "Supervisor", isRequired: true },
    ]);
  }, []);

  const handleRemoveStep = useCallback((key: string) => {
    setSteps((prev) => {
      if (prev.length <= 1) {
        toast.error("ต้องมีอย่างน้อย 1 ขั้นตอน");
        return prev;
      }
      return prev.filter((s) => s.key !== key);
    });
  }, []);

  const handleChange = useCallback(
    (key: string, field: "approverType" | "isRequired", value: string | boolean) => {
      setSteps((prev) =>
        prev.map((s) => (s.key === key ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  const handleSubmit = async () => {
    if (!selectedPositionId) {
      toast.error("กรุณาเลือกตำแหน่ง");
      return;
    }

    const payload = {
      positionId: selectedPositionId,
      steps: steps.map((s) => ({
        approverType: s.approverType,
        isRequired: s.isRequired,
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      toast.success("เพิ่มลำดับการอนุมัติเรียบร้อยแล้ว");
      setTimeout(() => router.push("/dashboard/hr/workflows"), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unknown error");
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
                  { label: "จัดการลำดับการอนุมัติ", href: "/dashboard/hr/workflows" },
                  { label: "เพิ่มลำดับการอนุมัติ" },
                ]}
              />

            <div className="bg-[#1a1a40] text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3">
                  <GitBranch className="w-6 h-6" />
                  <h2 className="text-xl font-medium tracking-wide">เพิ่มลำดับการอนุมัติ</h2>
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

            <div className="bg-white border-x border-b border-slate-200 p-8 shadow-sm rounded-b-2xl space-y-8">
              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-2">
                  เลือกตำแหน่ง
                </label>
                <select
                  value={selectedPositionId}
                  onChange={(e) => setSelectedPositionId(e.target.value)}
                  className="w-full max-w-md px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a40]/20 focus:border-[#1a1a40] bg-white"
                >
                  <option value="">-- กรุณาเลือก --</option>
                  {positions.map((p) => (
                    <option key={p.positionId} value={p.positionId}>
                      {p.positionName} {p.positionLevel != null ? `(Level ${p.positionLevel})` : ""}
                    </option>
                  ))}
                </select>
                {positions.length === 0 && (
                  <p className="text-sm text-amber-600 mt-2">ทุกตำแหน่งมีลำดับการอนุมัติแล้ว</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#191c1e] mb-4">
                  ขั้นตอนการอนุมัติ
                </label>
                <div className="space-y-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.key}
                      className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-2 min-w-[40px]">
                        <GripVertical className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-500">{index + 1}.</span>
                      </div>
                      <div className="flex-1">
                        <select
                          value={step.approverType}
                          onChange={(e) => handleChange(step.key, "approverType", e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a40]/20 focus:border-[#1a1a40] bg-white"
                        >
                          {APPROVER_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={step.isRequired}
                          onChange={(e) => handleChange(step.key, "isRequired", e.target.checked)}
                          className="rounded border-slate-300 text-[#1a1a40] focus:ring-[#1a1a40]/20"
                        />
                        Required
                      </label>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemoveStep(step.key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleAddStep}
                    className="border-slate-300 text-slate-600 hover:text-slate-900"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มขั้นตอน
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex justify-end items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-[#45464d] hover:text-[#0F172A] font-semibold rounded-xl h-11 min-w-[140px] border border-slate-300"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-[#1a1a40] hover:bg-[#2a2a5a] text-white font-semibold rounded-xl h-11 min-w-[140px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      บันทึก
                    </>
                  )}
                </Button>
              </div>
            </div>

            <HelpSection mode="create" entityName="ลำดับการอนุมัติ" />
          </div>
        </section>
      </main>
    </div>
  );
}
