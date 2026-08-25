"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useProgressRouter } from "@/components/ProgressBar";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { WarningBanner } from "@/components/ui/warning-banner";

import { LeaveFilters } from "@/components/leave-history/LeaveFilters";
import { LeaveTable } from "@/components/leave-history/LeaveTable";
import { Pagination } from "@/components/leave-history/Pagination";
import type { LeaveRecord } from "@/components/leave-history/types";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";
import type { LeaveHistoryResult } from "@/lib/services/leaveService";

type Props = {
  initialData: LeaveHistoryResult;
  initialTypeOptions: Array<{ id: string; label: string }>;
  initialStartDate: string;
  initialEndDate: string;
};

export default function LeaveHistoryClient({
  initialData,
  initialTypeOptions,
  initialStartDate,
  initialEndDate,
}: Props) {
  const router = useProgressRouter();

  const [leaveTypeOptions, setLeaveTypeOptions] = useState(initialTypeOptions);
  const monthStart = initialStartDate;
  const monthEnd = initialEndDate;
  const {
    live: { searchTerm, statusFilter, typeFilter, startDate, endDate },
    setFilter,
    applied: appliedFilters,
    page: currentPage,
    setPage: setCurrentPage,
    submit,
    reset,
  } = useFilterWithApply({
    searchTerm: "",
    statusFilter: "all",
    typeFilter: "all",
    startDate: monthStart,
    endDate: monthEnd,
  });

  const [data, setData] = useState<LeaveRecord[]>(initialData.data as LeaveRecord[]);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [approvedCount, setApprovedCount] = useState(initialData.approved);
  const [pendingCount, setPendingCount] = useState(initialData.pending);
  const [rejectedCount, setRejectedCount] = useState(initialData.rejected);
  const [cancelledCount, setCancelledCount] = useState(initialData.cancelled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [leaveTypeError] = useState("");

  // Initial page data is rendered by the server, so skip the very first refetch.
  const skipFirstFetch = useRef(true);

  const buildQuery = useCallback(
    (page: number, exportAll = false) => {
      const params = new URLSearchParams();
      if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
      if (appliedFilters.statusFilter && appliedFilters.statusFilter !== "all") params.set("status", appliedFilters.statusFilter);
      if (appliedFilters.typeFilter && appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
      if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
      if (exportAll) {
        params.set("exportAll", "true");
      } else {
        params.set("page", String(page));
      }
      return params.toString();
    },
    [appliedFilters],
  );

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const qs = buildQuery(currentPage);
        const res = await fetch(`/api/leaves/history?${qs}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch leave history");
        }

        if (!cancelled) {
          setData(json.data ?? []);
          setTotal(json.total ?? 0);
          setTotalPages(json.totalPages ?? 0);
          setApprovedCount(json.approved ?? 0);
          setPendingCount(json.pending ?? 0);
          setRejectedCount(json.rejected ?? 0);
          setCancelledCount(json.cancelled ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch leave history",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [buildQuery, currentPage]);

  const handleExportCSV = () => {
    const qs = `${buildQuery(1, true)}&stream=true`;
    window.location.href = `/api/leaves/history?${qs}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <main className="flex-grow p-4 md:p-8 mx-auto py-10 transition-all duration-300 ease-in-out w-full">
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "Leave History" }]}
          className="mb-4"
        />
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">ประวัติการลา</h1>
            <p className="text-[15px] leading-[20px] text-[#47464f]">View and manage your leave request history.</p>
          </div>

            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-[#47464f] hover:text-[#070235] h-11"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </Button>
          </div>
        </div>

        <WarningBanner message={leaveTypeError} className="mb-4" />

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50">
            <LeaveFilters
              searchTerm={searchTerm}
              onSearchChange={(v) => setFilter("searchTerm", v)}
              statusFilter={statusFilter}
              onStatusChange={(v) => setFilter("statusFilter", v)}
              typeFilter={typeFilter}
              onTypeChange={(v) => setFilter("typeFilter", v)}
              typeOptions={leaveTypeOptions}
              startDate={startDate}
              onStartDateChange={(v) => setFilter("startDate", v)}
              endDate={endDate}
              onEndDateChange={(v) => setFilter("endDate", v)}
              totalItems={total}
              approvedItems={approvedCount}
              pendingItems={pendingCount}
              rejectedItems={rejectedCount}
              cancelledItems={cancelledCount}
              onReset={() => reset({ searchTerm: "", statusFilter: "all", typeFilter: "all", startDate: monthStart, endDate: monthEnd })}
              onExportCSV={handleExportCSV}
              onSearchSubmit={submit}
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <LeaveTable data={data} />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}