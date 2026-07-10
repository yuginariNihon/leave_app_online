"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import { StaffTable } from "@/components/hr/StaffTable";
import { Pagination } from "@/components/leave-history/Pagination";
import type { StaffListItem } from "@/lib/services/leaveService";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function StaffListPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<StaffListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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

  const handleToggleActive = async (staffId: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, staffId]);
    try {
      const res = await fetch(`/api/hr/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      setData((prev) =>
        prev.map((s) =>
          s.staffId === staffId ? { ...s, isActive: !currentActive } : s,
        ),
      );
    } catch {
      // silently fail
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== staffId));
    }
  };

  useEffect(() => {
    async function loadDepartments() {
      try {
        const res = await fetch("/api/leave-options");
        const json = await res.json();
      } catch {
        // silently fail
      }
    }
    loadDepartments();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (departmentFilter !== "all") params.set("departmentId", departmentFilter);
        params.set("page", String(currentPage));

        const res = await fetch(`/api/hr/staff-list?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to fetch");
        if (!cancelled) {
          setData(json.data ?? []);
          setTotal(json.total ?? 0);
          setTotalPages(json.totalPages ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [searchTerm, statusFilter, departmentFilter, currentPage, fetchKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "Staff List" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">รายชื่อพนักงาน</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage employee records and employment details.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
                placeholder="ค้นหารหัสพนักงาน..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <div className="w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-full md:w-[160px] !h-11 border-[#c8c5d0] rounded-lg">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะ: ทั้งหมด</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {total} employees</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <StaffTable data={data} onToggleActive={handleToggleActive} togglingIds={togglingIds} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}
