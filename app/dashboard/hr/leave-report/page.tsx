"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Download, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/leave-history/StatusBadge";
import { Pagination } from "@/components/leave-history/Pagination";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import { LeaveStatus } from "@/lib/generated/prisma/enums";
import { statusTextMap } from "@/components/leave-history/types";
import { formatLeaveDateRange, formatDays, downloadCsv } from "@/lib/utils";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";

type ReportFilters = {
  searchTerm: string;
  departmentFilter: string;
  typeFilter: string;
  startDate: string;
  endDate: string;
};

type ReportRecord = {
  leaveId: string;
  staffCode: string;
  staffName: string;
  departmentName: string | null;
  leaveTypeName: string;
  startDate: string | null;
  endDate: string | null;
  totalDays: string | null;
  status: string;
  createdAt: string;
};

export default function LeaveReportPage() {
  const router = useRouter();

  const { live: { searchTerm, departmentFilter, typeFilter, startDate, endDate }, setFilter, applied: appliedFilters, page: currentPage, setPage: setCurrentPage, submit: handleSearchSubmit, reset: handleReset } = useFilterWithApply({
    searchTerm: "",
    departmentFilter: "all",
    typeFilter: "all",
    startDate: monthStart(),
    endDate: monthEnd(),
  });

  const [data, setData] = useState<ReportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<Array<{ id: string; label: string }>>([]);

  useEffect(() => {
    async function loadOptions() {
      const [deptRes, typeRes] = await Promise.all([
        fetch("/api/hr/departments"),
        fetch("/api/leave-options"),
      ]);
      if (deptRes.ok) {
        const json = await deptRes.json();
        setDepartmentOptions((json.data ?? []).map((d: { departmentId: string; departmentName: string }) => ({ id: d.departmentId, name: d.departmentName })));
      }
      if (typeRes.ok) {
        const json = await typeRes.json();
        setLeaveTypeOptions(json.data?.leaveTypes ?? []);
      }
    }
    loadOptions();
  }, []);

  function monthStart(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  }
  function monthEnd(d = new Date()) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  }

  const buildQuery = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
      if (appliedFilters.departmentFilter !== "all") params.set("departmentId", appliedFilters.departmentFilter);
      if (appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
      params.set("startDate", appliedFilters.startDate);
      params.set("endDate", appliedFilters.endDate);
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
        const res = await fetch(`/api/hr/leave-report?${qs}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error ?? "Failed to fetch report");
        }

        if (!cancelled) {
          setData(json.data ?? []);
          setTotal(json.total ?? 0);
          setTotalPages(json.totalPages ?? 0);
          setApprovedCount(json.approved ?? 0);
          setRejectedCount(json.rejected ?? 0);
          setCancelledCount(json.cancelled ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch report");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [buildQuery, currentPage]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedFilters.searchTerm) params.set("search", appliedFilters.searchTerm);
      if (appliedFilters.departmentFilter !== "all") params.set("departmentId", appliedFilters.departmentFilter);
      if (appliedFilters.typeFilter !== "all") params.set("leaveTypeId", appliedFilters.typeFilter);
      if (appliedFilters.startDate) params.set("startDate", appliedFilters.startDate);
      if (appliedFilters.endDate) params.set("endDate", appliedFilters.endDate);
      params.set("limit", String(total || 1));

      const res = await fetch(`/api/hr/leave-report?${params}`);
      const json = await res.json();
      if (!res.ok) return;

      const rows: ReportRecord[] = json.data ?? [];

      const headers = [
        "รหัสพนักงาน",
        "ชื่อ-นามสกุล",
        "แผนก",
        "ประเภทการลา",
        "วันที่ลา",
        "จำนวนวัน",
        "สถานะ",
      ];

      const csvContent = rows.map((r) => [
        r.staffCode,
        r.staffName,
        r.departmentName ?? "",
        r.leaveTypeName,
        formatLeaveDateRange(r.startDate, r.endDate),
        r.totalDays ? `${Number(r.totalDays)} วัน` : "",
        statusTextMap[r.status as LeaveStatus] ?? r.status,
      ]);

      const BOM = "\uFEFF";
      const csvString =
        BOM +
        [headers, ...csvContent]
          .map((row) => row.map((cell) => `"${cell}"`).join(","))
          .join("\n");

      downloadCsv(`leave_report_${new Date().toISOString().split("T")[0]}.csv`, csvString);
    } catch (err) {
      console.warn("CSV export failed:", err);
    }
  };

  const exportPDF = async () => {
    const input = document.getElementById("leave-report-table");
    if (!input) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(input);
      const imgData = canvas.toDataURL("image/png");
      const PdfClass = (await import("jspdf")).jsPDF;
      const pdf = new PdfClass("l", "mm", "a4");
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`leave_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch {
      toast.error("Export PDF failed");
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "รายงานการลา" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">รายงานการลา</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">รายงานสรุปการลาของพนักงานทั้งหมด</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50">
            <div className="space-y-6 mb-2">
              <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl"
                    placeholder="ค้นหารหัสพนักงาน / ชื่อ..."
                    value={searchTerm}
                    onChange={(e) => setFilter("searchTerm", e.target.value)}
                  />
                </div>

                <div className="w-full md:w-auto">
                  <Select value={departmentFilter} onValueChange={(v) => setFilter("departmentFilter", v)}>
                    <SelectTrigger className="w-full md:w-[200px] !h-11 border-slate-200 rounded-xl">
                      <SelectValue placeholder="แผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">แผนก: ทั้งหมด</SelectItem>
                      {departmentOptions.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full md:w-auto">
                  <Select value={typeFilter} onValueChange={(v) => setFilter("typeFilter", v)}>
                    <SelectTrigger className="w-full md:w-[180px] !h-11 border-slate-200 rounded-xl">
                      <SelectValue placeholder="ประเภทการลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ประเภทการลา: ทั้งหมด</SelectItem>
                      {leaveTypeOptions.map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Input
                    type="date"
                    className="h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl w-full md:w-[160px]"
                    value={startDate}
                    onChange={(e) => setFilter("startDate", e.target.value)}
                  />
                  <span className="text-slate-400 font-medium">ถึง</span>
                  <Input
                    type="date"
                    className="h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl w-full md:w-[160px]"
                    value={endDate}
                    onChange={(e) => setFilter("endDate", e.target.value)}
                  />
                </div>

                <Button onClick={handleSearchSubmit} className="h-11 px-6 rounded-xl">
                  ค้นหา
                </Button>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-emerald-700">อนุมัติ <span className="font-bold">{approvedCount}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span className="text-red-600">ไม่อนุมัติ <span className="font-bold">{rejectedCount}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                    <span className="text-gray-600">ยกเลิก <span className="font-bold">{cancelledCount}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 ml-4 pl-4 border-l border-slate-200">
                    <span>รวมทั้งหมด <span className="text-[#1a1a40] font-bold">{total}</span> รายการ</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleReset({ searchTerm: "", departmentFilter: "all", typeFilter: "all", startDate: monthStart(), endDate: monthEnd() })}
                    className="h-11 px-4 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-slate-300"
                  >
                    ล้างตัวกรอง
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    className="h-11 px-4 flex items-center gap-2 rounded-xl"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportPDF}
                    disabled={pdfLoading}
                    className="h-11 px-4 flex items-center gap-2 rounded-xl"
                  >
                    {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <>
              <Table id="leave-report-table" containerClassName="overflow-auto max-h-[500px]">
                <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">รหัสพนักงาน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">แผนก</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ประเภทการลา</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">วันที่ลา</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">จำนวนวัน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {data.length > 0 ? (
                    data.map((item) => (
                      <TableRow key={item.leaveId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{item.staffCode}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{item.staffName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{item.departmentName ?? "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{item.leaveTypeName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                          {formatLeaveDateRange(item.startDate, item.endDate)}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{formatDays(item.totalDays)}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={item.status as LeaveStatus} text={statusTextMap[item.status as LeaveStatus] ?? item.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลรายงาน</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
