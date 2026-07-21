"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApprovalFilters } from "@/components/approval-requests/ApprovalFilters";
import { ApprovalTable } from "@/components/approval-requests/ApprovalTable";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import { Pagination } from "@/components/leave-history/Pagination";
import type { ApprovalRequestItem } from "@/lib/services/approvalService";
import DashboardContent from "@/components/DashboardContent";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";

export default function HrApprovalRequestsPage() {
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

  const { live: { searchTerm, typeFilter, startDate, endDate }, setFilter, applied: appliedFilters, page: currentPage, setPage: setCurrentPage, submit: handleSearchSubmit, reset: handleResetFilters } = useFilterWithApply({
    searchTerm: "",
    typeFilter: "all",
    startDate: "",
    endDate: "",
  });
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);

  const [data, setData] = useState<ApprovalRequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approved" | "rejected" | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectValue, setSelectValue] = useState("");

  useEffect(() => {
    async function loadTypeOptions() {
      try {
        const res = await fetch("/api/leave-options");
        const json = await res.json();
        if (res.ok) {
          setLeaveTypeOptions(json.data?.leaveTypes ?? []);
        }
      } catch {
        toast.error("ไม่สามารถโหลดตัวกรองประเภทการลาได้");
      }
    }
    loadTypeOptions();
  }, []);

  const buildQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
      if (appliedFilters.typeFilter && appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
      if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
      params.set("page", String(page));
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
        const res = await fetch(`/api/leaves/approvals/hr-pending?${qs}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch approvals");
        }

        if (!cancelled) {
          setData(json.data ?? []);
          setTotal(json.total ?? 0);
          setTotalPages(json.totalPages ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch approvals",
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
  }, [buildQuery, currentPage, fetchKey]);

  useEffect(() => {
    const status = searchParams.get("approvalResult");
    if (status === "approved") {
      toast.success("อนุมัติเรียบร้อยแล้ว", {
        className: "!bg-white !text-green-500 !border-green-500 !border-2",
      });
      router.replace("/dashboard/approval-requests/hr");
    } else if (status === "rejected") {
      toast.error("ไม่อนุมัติเรียบร้อยแล้ว", {
        className: "!bg-white !text-red-500 !border-red-500 !border-2",
      });
      router.replace("/dashboard/approval-requests/hr");
    }
  }, [router, searchParams]);



  const processApproval = async (
    approvalId: string,
    status: "approved" | "rejected",
  ) => {
    setProcessingIds((prev) => [...prev, approvalId]);
    try {
      const res = await fetch(`/api/leaves/approvals/hr/${approvalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to process");
      }
      toast.success(
        status === "approved"
          ? "อนุมัติคำขอเรียบร้อยแล้ว"
          : "ไม่อนุมัติคำขอเรียบร้อยแล้ว",
      );
      setSelectedIds([]);
      setCurrentPage(1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ไม่สามารถดำเนินการได้",
      );
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== approvalId));
    }
  };

  const processBulk = async (status: "approved" | "rejected") => {
    if (selectedIds.length === 0) {
      toast.error("กรุณาเลือกรายการที่ต้องการดำเนินการ")
      return;
    }

    const label = status === "approved" ? "อนุมัติ" : "ไม่อนุมัติ";

    setProcessingIds((prev) => [...prev, ...selectedIds]);
    try {
      const res = await fetch(`/api/leaves/approvals/hr/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approvalIds: selectedIds,
          status,
          comment: status === "rejected" ? rejectReason : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to bulk process");
      }
      toast.success(`${label} ${selectedIds.length} รายการเรียบร้อยแล้ว`)
      setSelectedIds([]);
      setCurrentPage(1);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ไม่สามารถดำเนินการได้",
      );
    } finally {
      setProcessingIds([]);
      setConfirmOpen(false);
      setPendingAction(null);
      setSelectValue("");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR Approvals" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">รายการคำขอลา (HR)</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Review and manage pending leave requests as HR.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
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

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border-b border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                เลือก {selectedIds.length} รายการ
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Select
                  value={selectValue}
                  onValueChange={(value) => {
                    const action = value as "approved" | "rejected";
                    setSelectValue(value);
                    setPendingAction(action);
                    if (action === "rejected") setRejectReason("");
                    setConfirmOpen(true);
                  }}
                >
                  <SelectTrigger className="w-[180px] !h-11 border-blue-200 bg-white rounded-lg">
                    <SelectValue placeholder="เลือก action..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        อนุมัติทั้งหมด
                      </span>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <span className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        ไม่อนุมัติทั้งหมด
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <ApprovalTable
                data={data}
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                onApprove={(id) => processApproval(id, "approved")}
                onReject={(id) => processApproval(id, "rejected")}
                processingIds={processingIds}
                detailBasePath="/dashboard/approval-requests/hr/detail"
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
            )}
          </div>

        <style>{`@keyframes dialogEnter{from{opacity:0;transform:scale(0.88) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        <style>{`[data-slot="alert-dialog-overlay"]{backdrop-filter:blur(8px)!important;background-color:rgba(25,28,30,0.4)!important;animation-duration:400ms!important;animation-timing-function:cubic-bezier(0.16,1,0.3,1)!important}`}</style>
        <AlertDialog open={confirmOpen} onOpenChange={(open) => { setConfirmOpen(open); if (!open) setSelectValue(""); }}>
          <AlertDialogContent className="max-w-[480px] !rounded-xl overflow-hidden !p-0 !bg-[#ffffff] border border-[#c8c5ce] shadow-[0px_4px_12px_rgba(0,0,0,0.05)] !animate-[dialogEnter_400ms_cubic-bezier(0.16,1,0.3,1)]">
            <div className={cn("h-1", pendingAction === "approved" ? "bg-[#006c48]" : "bg-[#ba1a1a]")} />

            <div className="p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className={cn("flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center", pendingAction === "approved" ? "bg-[#55fbb4] text-[#00714b]" : "bg-[#ffdad6] text-[#93000a]")}>
                  {pendingAction === "approved" ? (
                    <CheckCircle2 className="!w-7 !h-7" />
                  ) : (
                    <XCircle className="!w-7 !h-7" />
                  )}
                </div>
                <div className="flex-grow pt-1">
                  <AlertDialogTitle className="text-[20px] font-semibold leading-[28px] text-[#020220]">
                    {pendingAction === "approved"
                      ? `ยืนยันการอนุมัติ ${selectedIds.length} รายการ?`
                      : `ยืนยันการไม่อนุมัติ ${selectedIds.length} รายการ?`}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-[14px] leading-[20px] text-[#47464e] mt-1">
                    {pendingAction === "approved"
                      ? "การยืนยันนี้จะทำให้รายการที่เลือกดำเนินการขั้นตอนถัดไปในระบบทันที"
                      : "กรุณาระบุเหตุผลก่อนดำเนินการ"}
                  </AlertDialogDescription>
                </div>
              </div>

              {data.filter((item) => selectedIds.includes(item.approvalId)).length > 0 && (
                <div className="space-y-3 mb-6 max-h-[240px] overflow-y-auto pr-2">
                  {data.filter((item) => selectedIds.includes(item.approvalId)).map((item) => (
                    <div key={item.approvalId} className="flex items-center justify-between p-3 border-b border-[#c8c5ce] last:border-b-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 shrink-0 text-[#47464e]" />
                        <span className="text-[14px] leading-[20px] text-[#020220] truncate">
                          {item.leaveTypeName} - {item.staffName}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold leading-[18px] text-[#47464e] shrink-0 ml-2 whitespace-nowrap">
                        {item.totalDays ? `${parseFloat(item.totalDays)} วัน` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {pendingAction === "rejected" && (
                <div className="mb-6">
                  <label className="block text-[13px] font-semibold leading-[18px] text-[#47464e] mb-1">
                    เหตุผลการไม่อนุมัติ
                  </label>
                  <Textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="ระบุเหตุผล..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <AlertDialogCancel className="w-full sm:w-1/2 h-10 flex items-center justify-center rounded-lg border border-[#c8c5ce] text-[#020220] text-[13px] font-semibold leading-[18px] bg-[#ffffff] hover:bg-[#e6e8ea] transition-colors duration-200 active:scale-95">
                  ปิด
                </AlertDialogCancel>
                <Button
                  onClick={() => pendingAction && processBulk(pendingAction)}
                  disabled={processingIds.length > 0}
                  className={cn(
                    "w-full sm:w-1/2 h-10 flex items-center justify-center rounded-lg text-[13px] font-semibold leading-[18px] transition-all duration-200 shadow-sm border-0 cursor-pointer active:scale-95",
                    pendingAction === "approved"
                      ? "bg-[#006c48] text-white hover:bg-[#00714b] disabled:bg-[#006c48]/50"
                      : "bg-[#ba1a1a] text-white hover:bg-[#93000a] disabled:bg-[#ba1a1a]/50",
                  )}
                >
                  {processingIds.length > 0 && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {processingIds.length > 0
                    ? "กำลังดำเนินการ..."
                    : pendingAction === "approved"
                      ? "ยืนยันการอนุมัติ"
                      : "ยืนยันการไม่อนุมัติ"}
                </Button>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </DashboardContent>
    </div>
  );
}
