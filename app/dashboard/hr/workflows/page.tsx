"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, FileText, User, Pencil, Plus } from "lucide-react";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";


type StepDisplay = {
  level: number;
  approverLabel: string;
  isRequired: boolean;
};

type WorkflowItem = {
  workflowId: string;
  positionName: string;
  positionLevel: number | null;
  isActive: boolean;
  steps: StepDisplay[];
};

export default function WorkflowsPage() {
  const router = useRouter();

  const [data, setData] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/hr/workflows");
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch workflows");
        }

        if (!cancelled) {
          setData(json.data ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch workflows");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return (
        <>

        <style>{`
          .flow-container::-webkit-scrollbar { height: 4px; }
          .flow-container::-webkit-scrollbar-thumb { background: #e0e3e5; border-radius: 4px; }
        `}</style>

        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการลำดับการอนุมัติ" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการลำดับการอนุมัติ</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">แสดงลำดับขั้นตอนการอนุมัติใบลาตามตำแหน่ง</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/hr/workflows/add")}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a40] text-white rounded-xl text-sm font-semibold hover:bg-[#2a2a5a] transition-colors"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">ทั้งหมด {data.length} ตำแหน่ง</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : data.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 p-4">
              {data.map((item) => (
                <div
                  key={item.workflowId}
                  className="bg-white border border-[#c8c5d0] rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  <div className="flex flex-col md:flex-row items-stretch md:items-center p-4 gap-6">
                    <div className="flex items-center gap-4 min-w-[240px]">
                      <div className="w-12 h-12 bg-[#1e1b4b] text-white rounded-full flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] leading-[16px] font-semibold text-[#787680] uppercase tracking-wider">Role</span>
                        <span className="text-[20px] leading-[28px] font-semibold text-[#070235]">{item.positionName}</span>
                      </div>
                    </div>

                    <div className="flex-1 overflow-x-auto py-1 flow-container">
                      <div className="flex items-center gap-2">
                        {item.steps.length > 0 ? (
                          item.steps.map((step, sIdx) => (
                            <React.Fragment key={step.level}>
                              {sIdx > 0 && (
                                <ArrowRight className="w-5 h-5 text-[#c8c5d0] shrink-0" />
                              )}
                              <div className="bg-[#eceef0] px-4 py-1.5 rounded-lg border border-[#c8c5d0] text-[13px] leading-[18px] font-semibold text-[#070235] whitespace-nowrap group-hover:border-emerald-300 transition-colors">
                                <span className="text-emerald-700/60 mr-1">{step.level}.</span>
                                {step.approverLabel}
                              </div>
                            </React.Fragment>
                          ))
                        ) : (
                          <span className="italic text-[#47464f] opacity-60 text-[14px] leading-[20px]">ไม่มีขั้นตอน (No steps defined)</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-2 min-w-[120px]">
                      <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${item.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-black border-gray-300"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-emerald-500" : "bg-gray-400"}`} />
                        <span className="text-[13px] leading-[18px] font-bold">{item.isActive ? "Active" : "Inactive"}</span>
                      </div>
                      <Button
                        onClick={() => router.push(`/dashboard/hr/workflows/edit?workflowId=${item.workflowId}`)}
                        className="p-2 hover:bg-[#eceef0] rounded-full transition-colors text-[#787680] hover:text-[#070235]"
                        title="แก้ไขลำดับการอนุมัติ"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-[#47464f]">
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 opacity-20" />
                <span>ไม่พบข้อมูลลำดับการอนุมัติ</span>
              </div>
            </div>
          )}
        </div>

        </>
  );
}
