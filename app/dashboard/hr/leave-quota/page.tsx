"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, CheckCircle2, AlertTriangle, Users, CalendarCheck, Umbrella } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { apiFetch } from "@/lib/api";
import type { LeaveTypeListItem, MissingQuotaResult, AssignLeaveLimitResult } from "@/lib/services/leaveService";
import { toast } from "sonner";

export default function LeaveQuotaPage() {
  const [fetchKey, setFetchKey] = useState(0);

  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeListItem[]>([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesError, setTypesError] = useState("");

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [info, setInfo] = useState<MissingQuotaResult | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState("");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [maxDays, setMaxDays] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchTypes() {
      setTypesLoading(true);
      setTypesError("");
      try {
        const json = await apiFetch<{ data: LeaveTypeListItem[] }>("/api/hr/leave-types");
        if (!cancelled) setLeaveTypes(json.data);
      } catch {
        if (!cancelled) setTypesError("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    }
    fetchTypes();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const loadMissing = async (leaveTypeId: string) => {
    if (!leaveTypeId) return;
    setInfoLoading(true);
    setInfoError("");
    try {
      const json = await apiFetch<{ data: MissingQuotaResult }>(
        `/api/hr/leave-quota/missing?leaveTypeId=${encodeURIComponent(leaveTypeId)}`,
      );
      setInfo(json.data);
    } catch (err) {
      setInfo(null);
      setInfoError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลพนักงานที่ยังไม่มีสิทธิ์ได้");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setSelectedTypeId(value);
    setInfo(null);
    setInfoError("");
    setSelectedIds(new Set());
    setMaxDays("");
    setSearchTerm("");
    loadMissing(value);
  };

  const isVacation = info?.leaveType.isVacationLeave ?? false;
  const missing = useMemo(() => info?.missing ?? [], [info]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return missing;
    return missing.filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        m.staffCode.toLowerCase().includes(term) ||
        (m.departmentName ?? "").toLowerCase().includes(term) ||
        (m.positionName ?? "").toLowerCase().includes(term),
    );
  }, [missing, searchTerm]);

  const toggleOne = (staffId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) next.delete(staffId);
      else next.add(staffId);
      return next;
    });
  };

  // Select-all applies to the currently visible (search-filtered) rows only,
  // so a search + select-all never silently targets off-screen staff.
  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.staffId));

  const toggleAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((m) => next.delete(m.staffId));
      else filtered.forEach((m) => next.add(m.staffId));
      return next;
    });
  };

  const maxDaysValue = maxDays.trim() === "" ? Number.NaN : Number(maxDays);
  const maxDaysValid = maxDays.trim() !== "" && Number.isFinite(maxDaysValue) && maxDaysValue >= 0;
  const canSubmit = selectedIds.size > 0 && (isVacation || maxDaysValid) && !submitting;

  const handleAssign = async () => {
    if (!info || !canSubmit) return;
    setSubmitting(true);
    try {
      const json = await apiFetch<{ data: AssignLeaveLimitResult }>("/api/hr/leave-quota/assign", {
        method: "POST",
        body: JSON.stringify({
          leaveTypeId: info.leaveType.leaveTypeId,
          staffIds: Array.from(selectedIds),
          maxDays: isVacation ? 0 : maxDaysValue,
        }),
      });
      const r = json.data;

      const parts: string[] = [`สร้างสิทธิ์ให้ ${r.created} คน`];
      if (r.skippedDuplicate > 0) parts.push(`ข้าม ${r.skippedDuplicate} คน (มีสิทธิ์อยู่แล้ว)`);
      if (r.skippedInactive > 0) parts.push(`ข้าม ${r.skippedInactive} คน (ไม่ได้ทำงาน/ไม่มีวันเริ่มงาน)`);
      toast.success(`บันทึกสิทธิ์ประเภท "${r.leaveTypeName}" ปี ${r.year} สำเร็จ — ${parts.join(" · ")}`);

      setSelectedIds(new Set());
      setMaxDays("");
      setSearchTerm("");
      await loadMissing(info.leaveType.leaveTypeId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการสร้างสิทธิ์");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <AppBreadcrumb
        items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการสิทธิ์วันลา" }]}
        className="mb-4"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
        <div>
          <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการสิทธิ์วันลา</h1>
          <p className="text-[14px] leading-[20px] text-[#47464f]">
            สร้างสิทธิ์วันลาให้พนักงานที่ยังไม่มีสิทธิ์ของประเภทที่เลือก (เฉพาะพนักงานที่ยังทำงานอยู่และมีวันเริ่มงาน)
          </p>
        </div>
      </div>

      {/* Step 1 — เลือกประเภทการลา */}
      <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="leave-type" className="text-[13px] font-semibold text-[#47464f]">
              1. เลือกประเภทการลา
            </Label>
            <Select value={selectedTypeId} onValueChange={handleTypeChange} disabled={typesLoading}>
              <SelectTrigger id="leave-type" className="mt-2 h-11 w-full text-[14px] border-[#c8c5d0] rounded-lg">
                <SelectValue placeholder="— กรุณาเลือกประเภทการลา —" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-[320px]">
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.leaveTypeId} value={lt.leaveTypeId} disabled={!lt.isActive}>
                    <span className="flex items-center gap-2">
                      <span>{lt.leaveTypeName}</span>
                      {!lt.isActive && (
                        <span className="text-[12px] text-[#787680]">(ปิดใช้งาน)</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {typesError && <p className="mt-2 text-[13px] text-red-600">{typesError}</p>}
          </div>

          <div className="md:w-[220px]">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#47464f]">
              <CalendarCheck className="w-4 h-4" />
              ปีที่ใช้
            </div>
            <div className="mt-2 h-11 flex items-center px-4 rounded-lg border border-dashed border-[#c8c5d0] bg-slate-50 text-[14px] text-[#47464f]">
              {info ? `${info.year} (ปีปัจจุบัน)` : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Step 2 — สรุป + รายชื่อที่ยังไม่มีสิทธิ์ */}
      {!selectedTypeId ? (
        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg py-20 text-center text-[#47464f]">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-[14px]">กรุณาเลือกประเภทการลา เพื่อดูรายชื่อพนักงานที่ยังไม่มีสิทธิ์</p>
        </div>
      ) : infoLoading ? (
        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg py-20 text-center text-[#47464f]">
          กำลังโหลด...
        </div>
      ) : infoError ? (
        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg py-20 text-center text-red-600">
          {infoError}
        </div>
      ) : info && info.missingCount === 0 ? (
        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg py-20 text-center">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
          <p className="text-[16px] font-semibold text-[#070235]">พนักงานทุกคนมีสิทธิ์ประเภทนี้แล้ว</p>
          <p className="text-[14px] text-[#47464f] mt-1">
            พนักงานที่ยังทำงานอยู่ทั้งหมด {info.totalActiveStaff} คน มีสิทธิ์ &quot;{info.leaveType.leaveTypeName}&quot; ปี {info.year} ครบแล้ว
          </p>
        </div>
      ) : info ? (
        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          {/* Summary */}
          <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.05em] font-semibold text-[#787680]">ประเภท</p>
              <p className="text-[15px] font-semibold text-[#070235] mt-1">{info.leaveType.leaveTypeName}</p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.05em] font-semibold text-[#787680]">โควตาตามประเภท</p>
              <p className="text-[15px] font-semibold text-[#070235] mt-1">
                {isVacation ? "คำนวณอัตโนมัติ" : info.leaveType.maxDaysPerYear ?? "ไม่จำกัด"}
              </p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.05em] font-semibold text-[#787680]">ยังไม่มีสิทธิ์</p>
              <p className="text-[15px] font-semibold text-amber-600 mt-1">{info.missingCount} คน</p>
            </div>
            <div>
              <p className="text-[12px] uppercase tracking-[0.05em] font-semibold text-[#787680]">มีสิทธิ์แล้ว</p>
              <p className="text-[15px] font-semibold text-emerald-600 mt-1">
                {info.alreadyHave} / {info.totalActiveStaff} คน
              </p>
            </div>
          </div>

          {/* Assign bar */}
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex flex-col lg:flex-row lg:items-end gap-4">
            {isVacation ? (
              <div className="flex-1 flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-3">
                <Umbrella className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[13px] leading-[20px] text-blue-800">
                  ระบบจะคำนวณโควตาจากอายุการทำงาน (6 / 8 / 10 วัน) บวกกับสิทธิ์ค้างจากปีก่อนไม่เกิน 6 วัน โดยอัตโนมัติ
                  <br />
                  <span className="text-blue-600">ไม่ต้องกรอกจำนวนวัน — ค่าที่กรอกได้แล้วจะถูกแก้ไขตามสูตร</span>
                </p>
              </div>
            ) : (
              <div className="flex-1 max-w-[280px]">
                <Label htmlFor="max-days" className="text-[13px] font-semibold text-[#47464f]">
                  2. จำนวนวันลาสูงสุดต่อปี (ต่อ 1 คน)
                </Label>
                <Input
                  id="max-days"
                  type="number"
                  min={0}
                  max={999}
                  step="0.5"
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  placeholder="เช่น 6"
                  className="mt-2 h-11 border-[#c8c5d0] rounded-lg text-[14px]"
                />
                {maxDays.trim() !== "" && !maxDaysValid && (
                  <p className="mt-1 text-[13px] text-red-600">จำนวนวันต้องเป็นตัวเลขที่ไม่ติดลบ (0 – 999)</p>
                )}
                {maxDays.trim() === "" && (
                  <p className="mt-1 text-[13px] text-[#787680]">กรอกจำนวนวันก่อนจึงจะกดสร้างสิทธิ์ได้</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 lg:ml-auto">
              <span className="text-[13px] text-[#47464f]">
                เลือกแล้ว <span className="font-semibold text-[#070235]">{selectedIds.size}</span> คน
              </span>
              <Button
                onClick={handleAssign}
                disabled={!canSubmit}
                className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-5 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
              >
                {submitting ? "กำลังบันทึก..." : `สร้างสิทธิ์${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-[#c8c5d0] flex items-center justify-between gap-4">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">
              พนักงานที่ยังไม่มีสิทธิ์ ({info.missingCount} คน)
            </h4>
            <div className="relative w-full md:w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[18px] h-[18px]" />
              <Input
                className="pl-10 h-9 border-[#c8c5d0] rounded-lg text-[14px]"
                placeholder="ค้นหาชื่อ / รหัส / แผนก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table containerClassName="max-h-[520px] overflow-y-auto">
              <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[48px] px-4 py-4">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={toggleAllFiltered}
                      disabled={filtered.length === 0}
                      aria-label="เลือกทั้งหมดที่แสดง"
                      className="h-4 w-4 data-[state=checked]:bg-[#6063ee] data-[state=checked]:border-[#6063ee]"
                    />
                  </TableHead>
                  <TableHead className="text-white font-semibold px-4 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">รหัสพนักงาน</TableHead>
                  <TableHead className="text-white font-semibold px-4 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อ-นามสกุล</TableHead>
                  <TableHead className="text-white font-semibold px-4 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">แผนก</TableHead>
                  <TableHead className="text-white font-semibold px-4 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ตำแหน่ง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#c8c5d0]">
                {filtered.length > 0 ? (
                  filtered.map((m) => (
                    <TableRow key={m.staffId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                      <TableCell className="px-4 py-3">
                        <Checkbox
                          checked={selectedIds.has(m.staffId)}
                          onCheckedChange={() => toggleOne(m.staffId)}
                          aria-label={`เลือก ${m.name}`}
                          className="h-4 w-4 data-[state=checked]:bg-[#6063ee] data-[state=checked]:border-[#6063ee]"
                        />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-[14px] leading-[20px] whitespace-nowrap text-[#47464f]">{m.staffCode}</TableCell>
                      <TableCell className="px-4 py-3 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{m.name}</TableCell>
                      <TableCell className="px-4 py-3 text-[14px] leading-[20px] text-[#47464f] whitespace-nowrap">{m.departmentName ?? "—"}</TableCell>
                      <TableCell className="px-4 py-3 text-[14px] leading-[20px] text-[#47464f] whitespace-nowrap">{m.positionName ?? "—"}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-[#47464f]">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-10 h-10 opacity-20" />
                        <span>ไม่พบพนักงานที่ตรงกับคำค้นหา</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {searchTerm.trim() !== "" && filtered.length !== missing.length && (
            <div className="px-6 py-3 border-t border-[#c8c5d0] text-[13px] text-[#787680] italic">
              แสดง {filtered.length} จาก {missing.length} คน (ปุ่ม &quot;เลือกทั้งหมด&quot; จะเลือกเฉพาะ {filtered.length} คนที่แสดงอยู่)
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
