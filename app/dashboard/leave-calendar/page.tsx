"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, User, Bell, Info, X, Sun, ArrowRight } from "lucide-react";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { useUser } from "@/lib/user-context";

type DayData = {
  date: string;
  isToday: boolean;
  count: number;
  leaves: { staffName: string; leaveTypeName: string; departmentName: string }[];
  holidayName: string | null;
};

type PendingRequest = {
  leaveId: string;
  staffName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
};

const LEAVETYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "ลาป่วย": { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  "ลาพักร้อน": { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  "ลากิจ": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  "คลอดบุตร": { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  "อุปสมบท": { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

function getLeaveStyle(type: string) {
  return LEAVETYPE_COLORS[type] ?? { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
}

export default function LeaveCalendarPage() {
  const router = useRouter();
  const { roles } = useUser();
  const isHR = roles.includes("HR") || roles.includes("SUPER_ADMIN");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [days, setDays] = useState<DayData[]>([]);
  const [pendingReqs, setPendingReqs] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const monthLabel = new Date(year, month).toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [calRes, pendRes] = await Promise.all([
        fetch(`/api/leaves/calendar?month=${monthParam}`),
        fetch(`/api/leaves/approvals/${isHR ? "hr-pending" : "pending"}?limit=2`),
      ]);
      const calJson = await calRes.json();
      if (calRes.ok) setDays(calJson.days ?? []);
      const pendJson = await pendRes.json();
      if (pendRes.ok) {
        const items: { leaveId?: string; staffName?: string; leaveTypeName?: string; startDate?: string | null; endDate?: string | null }[] = pendJson.data ?? [];
        setPendingReqs(items.map((r) => ({
          leaveId: r.leaveId ?? "",
          staffName: r.staffName ?? "",
          leaveTypeName: r.leaveTypeName ?? "",
          startDate: r.startDate ?? "",
          endDate: r.endDate ?? "",
        })));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [monthParam]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const goToPrevMonth = () => { if (month === 0) { setYear((y) => y - 1); setMonth(11); } else { setMonth((m) => m - 1); } };
  const goToNextMonth = () => { if (month === 11) { setYear((y) => y + 1); setMonth(0); } else { setMonth((m) => m + 1); } };
  const goToToday = () => { const d = new Date(); setYear(d.getFullYear()); setMonth(d.getMonth()); };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const weekdayLabels = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

  function formatLeaveDateRange(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = start === end;
    if (sameDay) return s.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    return `${s.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}-${e.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}`;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[12px] font-semibold text-[#45464d] mb-1 tracking-wider uppercase">
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0b1c30]">ปฏิทินการลา</span>
        </div>

        {/* Header + Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#0F172A]">ปฏิทินการลา</h1>
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-[#c6c6cd]/30 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-[18px] font-semibold min-w-[140px] text-center text-[#0F172A]">{monthLabel}</span>
              <button onClick={goToNextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="h-6 w-px bg-[#c6c6cd]" />
            <button onClick={goToToday} className="text-[12px] font-semibold text-[#0051d5] hover:underline tracking-wider uppercase px-2">วันนี้</button>
          </div>
        </div>

        {/* Main Calendar */}
        <div className="bg-white rounded-xl border border-[#c6c6cd]/30 shadow-[0_4px_12px_-2px_rgba(15,23,42,0.05)] overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#45464d]">กำลังโหลด...</div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[#c6c6cd]/30 bg-[#f2f6fc]/30">
                {weekdayLabels.map((label) => (
                  <div key={label} className="py-3 text-center text-[12px] font-semibold text-[#45464d] tracking-wider uppercase">
                    {label}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {/* Previous month trailing days */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`prev-${i}`} className="min-h-[120px] p-2 border-r border-b border-[#c6c6cd]/30 bg-[#f2f6fc]/20">
                    <span className="text-sm text-[#45464d]/50">{prevMonthDays - firstDayOfWeek + 1 + i}</span>
                  </div>
                ))}

                {/* Current month days */}
                {days.map((day) => {
                  const dateNum = new Date(day.date).getDate();
                  const showMany = day.leaves.length > 2;
                  const visibleLeaves = showMany ? day.leaves.slice(0, 2) : day.leaves;

                  return (
                    <div
                      key={day.date}
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-[120px] p-2 border-r border-b border-[#c6c6cd]/30 cursor-pointer transition-colors hover:bg-[#e5eeff]/50 ${day.isToday ? "bg-[#e5eeff]/50" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[14px] font-semibold ${day.isToday ? "text-[#0051d5]" : "text-[#0b1c30]"}`}>
                          {dateNum}
                        </span>
                        {day.isToday && <span className="w-2 h-2 rounded-full bg-[#0051d5]" />}
                      </div>
                      {day.holidayName && (
                        <div className="mb-1 px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight bg-amber-50 text-amber-700 border border-amber-200 truncate">
                          {day.holidayName}
                        </div>
                      )}
                      <div className="space-y-1">
                        {visibleLeaves.map((l, idx) => {
                          const style = getLeaveStyle(l.leaveTypeName);
                          return (
                            <div
                              key={idx}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold leading-tight ${style.bg} ${style.text} ${style.border} border truncate`}
                            >
                              {l.staffName} ({l.leaveTypeName})
                            </div>
                          );
                        })}
                        {showMany && (
                          <div className="text-[10px] font-semibold text-[#45464d] pl-1">+{day.leaves.length - 2} คน</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Bottom cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border-t border-[#c6c6cd]/30">
            {/* Pending requests */}
            <div className="bg-white rounded-xl border border-[#c6c6cd]/30 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#c6c6cd]/30 bg-[#f2f6fc]/30 flex items-center justify-between">
                <h2 className="text-[18px] font-semibold text-[#0F172A]">คำขอที่รอดำเนินการ</h2>
                {pendingReqs.length > 0 && (
                  <span className="bg-[#0051d5] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wider uppercase">
                    {pendingReqs.length} รายการ
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3 flex-1">
                {pendingReqs.length === 0 ? (
                  <p className="text-sm text-[#45464d] text-center py-4">ไม่มีคำขอที่รอดำเนินการ</p>
                ) : (
                  pendingReqs.slice(0, 2).map((req) => (
                    <div key={req.leaveId} className="flex items-center justify-between p-3 rounded-lg bg-[#f2f6fc]/20 border border-[#c6c6cd]/30">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#316bf3]/10 flex items-center justify-center text-[#0051d5]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#0b1c30]">{req.staffName}</p>
                          <p className="text-[10px] text-[#45464d]">{req.leaveTypeName} &bull; {formatLeaveDateRange(req.startDate, req.endDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 pb-4">
                <button onClick={() => router.push(isHR ? "/dashboard/approval-requests/hr" : "/dashboard/approval-requests")} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-[#0051d5] hover:text-[#0040a8] py-2 rounded-lg hover:bg-blue-50/50 transition-colors">
                  ดูรายการทั้งหมด
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* System announcements */}
            <div className="bg-white rounded-xl border border-[#c6c6cd]/30 overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[#c6c6cd]/30 bg-[#f2f6fc]/30">
                <h2 className="text-[18px] font-semibold text-[#0F172A]">แจ้งเตือนระบบ</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 text-[#0051d5]">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#0b1c30]">ปรับปรุงระบบประจำเดือน</p>
                    <p className="text-[12px] text-[#45464d]">ระบบจะปิดปรับปรุงในวันที่ 15 กรกฎาคม เวลา 22:00 - 02:00 น.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 text-[#0051d5]">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#0b1c30]">นโยบายการลาใหม่</p>
                    <p className="text-[12px] text-[#45464d]">กรุณาตรวจสอบระเบียบการลาพักร้อนใหม่ที่มีผลบังคับใช้ตั้งแต่เดือนนี้</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardContent>

      {/* Day popup */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-[642px] bg-white rounded-lg shadow-xl border border-slate-100 mx-4 max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h1 className="text-xl font-extrabold text-[#0F172A]">
                {new Date(selectedDay.date).toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </h1>
              <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-[#0F172A] transition-colors duration-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </header>

            {/* Content */}
            <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[55vh] bg-[#f8f9ff]">
              {selectedDay.holidayName && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="p-2 bg-white rounded-full">
                    <Sun className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800">วันหยุด</p>
                    <p className="text-sm text-amber-700">{selectedDay.holidayName}</p>
                  </div>
                </div>
              )}
              {selectedDay.leaves.length > 0 && (
                <>
                  <p className="text-sm font-semibold text-[#45464d]">พนักงานลา {selectedDay.count} คน</p>
                  <div className="space-y-3">
                    {selectedDay.leaves.map((l, i) => {
                      const style = getLeaveStyle(l.leaveTypeName);
                      return (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#0F172A]">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#0F172A]">{l.staffName}</p>
                              <p className="text-xs text-slate-500">{l.departmentName}</p>
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text} ${style.border}`}>{l.leaveTypeName}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
              {!selectedDay.holidayName && selectedDay.leaves.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-6 flex items-center justify-center">
                    <div className="absolute w-32 h-32 bg-[#eff4ff] rounded-full scale-110 opacity-60" />
                    <div className="relative z-10 p-6 bg-white rounded-full shadow-sm border border-slate-50">
                      <Sun className="w-12 h-12 text-[#0F172A] opacity-80" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-[#0F172A]">ไม่มีผู้ลาในวันนี้</p>
                    <p className="text-slate-500 text-sm mt-1 font-medium">ตารางเวลาว่างสำหรับทุกคน ทีมงานพร้อมปฏิบัติหน้าที่</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <footer className="px-6 py-4 bg-white border-t border-slate-50 flex justify-end">
              <button onClick={() => setSelectedDay(null)} className="text-sm font-bold text-[#0F172A]/70 hover:text-[#0F172A] px-4 py-2 rounded-lg transition-all duration-200">
                ดูมุมมองรายเดือน
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
