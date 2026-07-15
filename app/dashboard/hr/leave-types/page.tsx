"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Power, PowerOff, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import type { LeaveTypeListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";

export default function LeaveTypesPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<LeaveTypeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/hr/leave-types");
        if (!res.ok) throw new Error("Failed to load leave types");
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (lt) =>
      lt.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/hr/leave-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle");
      }
      setData((prev) =>
        prev.map((lt) => (lt.leaveTypeId === id ? { ...lt, isActive: !currentActive } : lt)),
      );
      toast.success(!currentActive ? "เปิดใช้งานประเภทการลาเรียบร้อย" : "ปิดใช้งานประเภทการลาเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการประเภทการลา" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการประเภทการลา</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage leave types and organizational policies.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
                placeholder="ค้นหาชื่อประเภท..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => router.push("/dashboard/hr/leave-types/add")}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-[18px] h-[18px]" />
              Add Leave Type
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} leave types</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table containerClassName="max-h-[500px] overflow-y-auto">
                <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อประเภท</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนวันสูงสุด/ปี</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">ได้เงิน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">ต้องแนบเอกสาร</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนกรณี</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนใบลา</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สถานะ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {filtered.length > 0 ? (
                    filtered.map((lt) => (
                      <TableRow key={lt.leaveTypeId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{lt.leaveTypeName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">{lt.maxDaysPerYear ?? "ไม่จำกัด"}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${lt.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            {lt.isPaid ? "ได้เงิน" : "ไม่ได้เงิน"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${lt.requiresAttachment ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-black border-gray-300"}`}>
                            {lt.requiresAttachment ? "ต้องแนบ" : "ไม่ต้องแนบ"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{lt.leaveCaseCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{lt.leaveCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${lt.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${lt.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {lt.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              onClick={() => router.push(`/dashboard/hr/leave-types/edit?leaveTypeId=${lt.leaveTypeId}`)}
                            >
                              <Pencil className="w-[20px] h-[20px]" />
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                              disabled={togglingIds.includes(lt.leaveTypeId)}
                              onClick={() => handleToggleActive(lt.leaveTypeId, lt.isActive)}
                            >
                              {lt.isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลประเภทการลา</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}
