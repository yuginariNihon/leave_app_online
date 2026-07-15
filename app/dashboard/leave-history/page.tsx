"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { formatDateOnly, downloadCsv } from "@/lib/utils";

import { LeaveFilters } from "@/components/leave-history/LeaveFilters";
import { LeaveTable } from "@/components/leave-history/LeaveTable";
import { Pagination } from "@/components/leave-history/Pagination";
import type { LeaveRecord } from "@/components/leave-history/types";
import { statusTextMap } from "@/components/leave-history/types";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";

export default function LeaveHistoryPage() {
  const router = useRouter();

  const [leaveTypeOptions, setLeaveTypeOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const { live: { searchTerm, statusFilter, typeFilter, startDate, endDate }, setFilter, applied: appliedFilters, page: currentPage, setPage: setCurrentPage, submit, reset } = useFilterWithApply({
    searchTerm: "",
    statusFilter: "all",
    typeFilter: "all",
    startDate: "",
    endDate: "",
  });

  const [data, setData] = useState<LeaveRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTypeOptions() {
      try {
        const res = await fetch("/api/leave-options");
        const json = await res.json();
        if (res.ok) {
          setLeaveTypeOptions(json.data?.leaveTypes ?? []);
        }
      } catch {
        // silently fail
      }
    }
    loadTypeOptions();
  }, []);

  const buildQuery = useCallback(
    (page: number, exportAll = false) => {
      const params = new URLSearchParams();
      if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
      if (appliedFilters.statusFilter !== "all") params.set("status", appliedFilters.statusFilter);
      if (appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
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

  const handleExportCSV = async () => {
    try {
      const qs = buildQuery(1, true);
      const res = await fetch(`/api/leaves/history?${qs}`);
      const json = await res.json();

      if (!res.ok) return;

      const rows: LeaveRecord[] = json.data ?? [];

      const headers = [
        "วันที่เขียนใบลา",
        "วันที่ลา",
        "ประเภทการลา",
        "จำนวนวันที่ลา",
        "สถานะ",
      ];

      const csvContent = rows.map((r) => [
        formatDateOnly(r.createdAt),
        r.startDate
          ? `${formatDateOnly(r.startDate)}${r.endDate && r.startDate !== r.endDate ? ` - ${formatDateOnly(r.endDate)}` : ""}`
          : "",
        r.leaveTypeName,
        r.totalDays ? `${Number(r.totalDays)} วัน` : "",
        statusTextMap[r.status] ?? r.status,
      ]);

      const BOM = "\uFEFF";
      const csvString =
        BOM +
        [headers, ...csvContent]
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n");

      downloadCsv(`leave_history_${new Date().toISOString().split("T")[0]}.csv`, csvString);
    } catch {
      // silently fail
    }
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
            <p className="text-[14px] leading-[20px] text-[#47464f]">View and manage your leave request history.</p>
          </div>
          
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-[#47464f] hover:text-[#070235]"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
                ย้อนกลับ
              </Button>
          </div>
        </div>

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
              onReset={() => reset({ searchTerm: "", statusFilter: "all", typeFilter: "all", startDate: "", endDate: "" })}
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
