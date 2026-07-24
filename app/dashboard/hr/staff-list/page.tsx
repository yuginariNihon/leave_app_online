"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StaffTable } from "@/components/hr/StaffTable";
import { Pagination } from "@/components/leave-history/Pagination";
import type { StaffListItem } from "@/lib/services/leaveService";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";

export default function StaffListPage() {
  const [fetchKey, setFetchKey] = useState(0);

  const { live: { searchTerm, statusFilter }, setFilter, applied: appliedFilters, page: currentPage, setPage: setCurrentPage, submit: handleSearchSubmit } = useFilterWithApply({
    searchTerm: "",
    statusFilter: "all",
    departmentFilter: "all",
  });

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
      toast.error("ไม่สามารถเปลี่ยนสถานะพนักงานได้");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== staffId));
    }
  };

  useEffect(() => {
    async function loadDepartments() {
      try {
        await fetch("/api/leave-options");
      } catch {
        toast.error("ไม่สามารถโหลดตัวกรองแผนกได้");
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
        if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
        if (appliedFilters.statusFilter !== "all") params.set("status", appliedFilters.statusFilter);
        if (appliedFilters.departmentFilter !== "all") params.set("departmentId", appliedFilters.departmentFilter);
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
  }, [appliedFilters, currentPage, fetchKey]);

  return (
        <>

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
                onChange={(e) => setFilter("searchTerm", e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-auto">
              <Select value={statusFilter} onValueChange={(v) => setFilter("statusFilter", v)}>
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
            <Button
              type="button"
              onClick={handleSearchSubmit}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Search className="w-[18px] h-[18px]" />
              ค้นหา
            </Button>
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

        </>
  );
}
