"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";


import { WarningBanner } from "@/components/ui/warning-banner";
import { Button } from "@/components/ui/button";
import { ApprovalFilters } from "@/components/approval-requests/ApprovalFilters";
import { ApprovalHistoryTable } from "@/components/approval-requests/ApprovalHistoryTable";
import { Pagination } from "@/components/leave-history/Pagination";
import { ChevronDown, ChevronUp } from "lucide-react";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";
import { apiFetch, ApiError } from "@/lib/api";

type HistoryItem = {
  approvalId: string;
  leaveId: string;
  staffName: string;
  staffCode: string;
  departmentName: string;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  reason: string | null;
  status: string;
  comment: string | null;
  actedAt: string | null;
  approvalLevel: number;
};

function ApprovalHistoryPageInner() {
const searchParams = useSearchParams();
  const [fetchKey, setFetchKey] = useState(0);
  const [filtersVisible, setFiltersVisible] = useState(true);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const [roleType] = useState(searchParams.get("roleType") || "all");
  const monthStart = (() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  })();
  const monthEnd = (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1, 0);
    return d.toISOString().split("T")[0];
  })();
  const { live: { searchTerm, typeFilter, startDate, endDate }, setFilter, applied: appliedFilters, page: currentPage, setPage: setCurrentPage, submit: handleSearchSubmit, reset: handleResetFilters } = useFilterWithApply({
    searchTerm: "",
    typeFilter: "all",
    startDate: monthStart,
    endDate: monthEnd,
  });
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [data, setData] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaveTypeError, setLeaveTypeError] = useState("");

  useEffect(() => {
    async function loadTypeOptions() {
      try {
const json = await apiFetch<{ data?: { leaveTypes?: Array<{ id: string; label: string }> } }>("/api/leave-options");
        setLeaveTypeOptions(json.data?.leaveTypes ?? []);
      } catch (err) {
        if (!(err instanceof ApiError)) setLeaveTypeError("ไม่สามารถโหลดตัวกรองประเภทการลาได้");
      }
    }
    loadTypeOptions();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
        if (appliedFilters.typeFilter && appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
        if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
        if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
        if (roleType !== "all") params.set("roleType", roleType);
        params.set("page", String(currentPage));

        const json = await apiFetch<{ data: HistoryItem[]; total: number; totalPages: number }>(
          `/api/leaves/approvals/history?${params}`,
        );
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
          items={[{ label: "Home", href: "/dashboard" }, { label: "Approval History" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">ประวัติการอนุมัติ</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">View approval history and past decisions.</p>
          </div>
        </div>

        <WarningBanner message={leaveTypeError} className="mb-4" />

<div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-4 py-3 md:hidden flex items-center justify-between border-b border-[#c8c5d0] bg-slate-50/50">
            <span className="text-sm font-semibold text-slate-700">ตัวกรอง</span>
            <Button
              variant="ghost"
              className="h-9 px-3 flex items-center gap-1 text-[#070235] font-semibold"
              onClick={() => setFiltersVisible((v) => !v)}
            >
              {filtersVisible ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span className="text-xs">{filtersVisible ? "ซ่อน" : "แสดง"}</span>
            </Button>
          </div>
          <div className={`${filtersVisible ? "" : "hidden"} md:block`}>
          <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50">
            <ApprovalFilters
              searchTerm={searchTerm}
              onSearchChange={(v) => setFilter("searchTerm", v)}
              typeFilter={typeFilter}
              onTypeChange={(v) => setFilter("typeFilter", v)}
              typeOptions={leaveTypeOptions}
              startDate={startDate}
              onStartDateChange={(v) => setFilter("startDate", v)}
              endDate={endDate}
              onEndDateChange={(v) => setFilter("endDate", v)}
              totalItems={total}
              onReset={handleResetFilters}
              onSearchSubmit={handleSearchSubmit}
            />
          </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <ApprovalHistoryTable data={data} />
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

export default function ApprovalHistoryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>}>
      <ApprovalHistoryPageInner />
    </Suspense>
  );
}
