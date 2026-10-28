"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

type DataTableProps = {
  /** หัวการ์ด (ไม่ใส่ = ไม่มีหัวการ์ด) */
  title?: string;
  /** ข้อความชิดขวาของหัวการ์ด เช่น "Showing 12 employees" */
  subtitle?: ReactNode;
  /** ตัวกรองด้านบน — ถูกย่อ/ขยายได้เฉพาะจอเล็กโดยอัตโนมัติ */
  filters?: ReactNode;
  /** แถบเครื่องมือเหนือตาราง (เช่น แถบเลือกหลายรายการ) — แสดงตลอดแม้กำลังโหลด */
  toolbar?: ReactNode;
  loading?: boolean;
  error?: string;
  /** แสดงสถานะว่างแทนตาราง (ตารางที่จัดการ empty row เองไม่ต้องส่ง) */
  isEmpty?: boolean;
  emptyText?: string;
  /** แถบแบ่งหน้า — แสดงต่อท้ายตารางเมื่อโหลดเสร็จ */
  pagination?: ReactNode;
  children: ReactNode;
  className?: string;
};

const CARD_CLASS = "bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden";

/**
 * การ์ดรายการ (list card) มาตรฐาน: หัวการ์ด + ตัวกรอง (ยุบบนมือถือ) +
 * สถานะ loading/error/ว่าง + ตาราง + แถบแบ่งหน้า
 * ใช้แทนบล็อกที่เขียนซ้ำในหน้า list ต่าง ๆ โดยหน้าคงเหลือเฉพาะ markup ของตาราง
 */
export function DataTable({
  title,
  subtitle,
  filters,
  toolbar,
  loading = false,
  error = "",
  isEmpty = false,
  emptyText = "ไม่พบข้อมูล",
  pagination,
  children,
  className = CARD_CLASS,
}: DataTableProps) {
  const [filtersVisible, setFiltersVisible] = useState(true);

  return (
    <div className={className}>
      {title && (
        <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
          <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">
            {title}
          </h4>
          {subtitle && (
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">{subtitle}</span>
          )}
        </div>
      )}

      {filters && (
        <>
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
            <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50">{filters}</div>
          </div>
        </>
      )}

      {toolbar}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
      ) : error ? (
        <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
      ) : isEmpty ? (
        <div className="flex justify-center items-center py-20 text-[#47464f]">{emptyText}</div>
      ) : (
        <>
          {children}
          {pagination}
        </>
      )}
    </div>
  );
}
