"use client";

import { FileText, Pencil, Power, PowerOff } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { StaffListItem } from "@/lib/services/leaveService";

interface StaffTableProps {
  data: StaffListItem[];
  onToggleActive: (staffId: string, currentActive: boolean) => void;
  togglingIds: string[];
}

export function StaffTable({ data, onToggleActive, togglingIds }: StaffTableProps) {
  const router = useRouter();

  return (
    <Table containerClassName="overflow-auto max-h-[500px]">
        <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">รหัสพนักงาน</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ชื่อ-นามสกุล</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">แผนก</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ตำแหน่ง</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">ประเภทพนักงาน</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase whitespace-nowrap">สถานะ</TableHead>
            <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-[#c8c5d0]">
          {data.length > 0 ? (
            data.map((staff) => (
              <TableRow key={staff.staffId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{staff.staffCode}</TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{staff.name}</TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{staff.departmentName ?? "-"}</TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{staff.positionName ?? "-"}</TableCell>
                <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{staff.employmentTypeName ?? "-"}</TableCell>
                <TableCell className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${staff.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${staff.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                    {staff.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                      onClick={() => router.push(`/dashboard/hr/staff-list/edit?id=${staff.staffId}`)}
                    >
                      <Pencil className="w-[20px] h-[20px]" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                      disabled={togglingIds.includes(staff.staffId)}
                      onClick={() => onToggleActive(staff.staffId, staff.isActive)}
                    >
                      {staff.isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-20 text-[#47464f]">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 opacity-20" />
                  <span>ไม่พบข้อมูลพนักงาน</span>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
    </Table>
  );
}
