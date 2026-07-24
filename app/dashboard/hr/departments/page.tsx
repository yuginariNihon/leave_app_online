"use client";

import { useState, useEffect } from "react";
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

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import type { DepartmentListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<DepartmentListItem[]>([]);
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
        const res = await fetch("/api/hr/departments");
        if (!res.ok) throw new Error("Failed to load departments");
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลแผนกได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (d) =>
      d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.departmentCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      const res = await fetch(`/api/hr/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle");
      }
      setData((prev) =>
        prev.map((d) => (d.departmentId === id ? { ...d, isActive: !currentActive } : d)),
      );
      toast.success(!currentActive ? "เปิดใช้งานแผนกเรียบร้อย" : "ปิดใช้งานแผนกเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  return (
        <>

        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการแผนก" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการแผนก</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage departments and organizational units.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
                placeholder="ค้นหาชื่อแผนก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => router.push("/dashboard/hr/departments/add")}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-[18px] h-[18px]" />
              Add Department
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} departments</span>
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
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">รหัสแผนก</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อแผนก</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนส่วนงาน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนพนักงาน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สถานะ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {filtered.length > 0 ? (
                    filtered.map((dept) => (
                      <TableRow key={dept.departmentId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold text-[#070235] whitespace-nowrap">{dept.departmentCode}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{dept.departmentName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{dept.sectionCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{dept.staffCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${dept.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              onClick={() => router.push(`/dashboard/hr/departments/edit?departmentId=${dept.departmentId}`)}
                            >
                              <Pencil className="w-[20px] h-[20px]" />
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                              disabled={togglingIds.includes(dept.departmentId)}
                              onClick={() => handleToggleActive(dept.departmentId, dept.isActive)}
                            >
                              {dept.isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลแผนก</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        </>
  );
}
