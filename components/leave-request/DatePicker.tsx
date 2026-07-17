"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  min?: string;
  max?: string;
  holidays?: string[];
  placeholder?: string;
}

function toLocalDateStr(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function DatePicker({ value, onChange, min, max, holidays = [], placeholder = "เลือกวันที่" }: DatePickerProps) {
  const now = new Date();
  const initialView = value ? new Date(value + "T00:00:00") : now;
  const [viewYear, setViewYear] = useState(initialView.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialView.getMonth());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  const weekdayLabels = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const isDisabled = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    if (d.getDay() === 0) return true;
    if (holidays.includes(dateStr)) return true;
    if (min && dateStr < min) return true;
    if (max && dateStr > max) return true;
    return false;
  };

  const todayStr = toLocalDateStr(new Date());

  const handleDayClick = (dateStr: string) => {
    if (isDisabled(dateStr)) return;
    onChange(dateStr);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full h-11 px-3 rounded-lg border text-sm transition-colors bg-white",
          value
            ? "border-gray-200 text-[#070235]"
            : "border-gray-200 text-slate-400",
        )}
      >
        <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
        <span>{value ? value : placeholder}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-[300px] bg-white rounded-xl border border-[#c8c5d0] shadow-lg p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => { if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); } else { setViewMonth((m) => m - 1); } }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[#070235]">{monthLabel}</span>
            <button
              type="button"
              onClick={() => { if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); } else { setViewMonth((m) => m + 1); } }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekdayLabels.map((label, i) => (
              <div key={i} className={cn(
                "h-8 flex items-center justify-center text-xs font-semibold",
                i === 0 ? "text-red-400" : "text-slate-500",
              )}>
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {/* Previous month trailing days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const day = prevMonthDays - firstDayOfWeek + 1 + i;
              return (
                <div key={`prev-${i}`} className="h-9 flex items-center justify-center">
                  <span className="text-xs text-slate-300">{day}</span>
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const disabled = isDisabled(dateStr);
              const selected = dateStr === value;
              const isToday = dateStr === todayStr;
              const isSunday = new Date(dateStr + "T00:00:00").getDay() === 0;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDayClick(dateStr)}
                  className={cn(
                    "h-9 flex items-center justify-center text-sm rounded-lg transition-colors relative",
                    disabled
                      ? "text-slate-300 cursor-not-allowed"
                      : selected
                        ? "bg-[#6063ee] text-white font-semibold hover:bg-[#4f52d6]"
                        : "text-[#070235] hover:bg-slate-100 cursor-pointer",
                    isToday && !selected && "font-semibold text-[#6063ee]",
                  )}
                >
                  {day}
                  {isToday && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#6063ee]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
