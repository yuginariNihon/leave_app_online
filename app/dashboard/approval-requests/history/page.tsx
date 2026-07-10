"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import { ApprovalFilters } from "@/components/approval-requests/ApprovalFilters";
import { ApprovalHistoryTable } from "@/components/approval-requests/ApprovalHistoryTable";
import { Pagination } from "@/components/leave-history/Pagination";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const [roleType, setRoleType] = useState(searchParams.get("roleType") || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (typeFilter !== "all") params.set("leaveTypeId", typeFilter);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (roleType !== "all") params.set("roleType", roleType);
        params.set("page", String(currentPage));

        const res = await fetch(`/api/leaves/approvals/history?${params}`);
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
  }, [searchTerm, typeFilter, startDate, endDate, currentPage, fetchKey]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(1);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
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

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50">
            <ApprovalFilters
              searchTerm={searchTerm}
              onSearchChange={handleSearchChange}
              typeFilter={typeFilter}
              onTypeChange={handleTypeChange}
              typeOptions={leaveTypeOptions}
              startDate={startDate}
              onStartDateChange={handleStartDateChange}
              endDate={endDate}
              onEndDateChange={handleEndDateChange}
              totalItems={total}
              onReset={handleResetFilters}
            />
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
      </DashboardContent>
    </div>
  );
}

export default function ApprovalHistoryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>}>
      <ApprovalHistoryPageInner />
    </Suspense>
  );
}
