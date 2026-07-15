import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeaveFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter?: string;
  onStatusChange?: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  typeOptions: Array<{ id: string; label: string }>;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  totalItems: number;
  approvedItems?: number;
  pendingItems?: number;
  rejectedItems?: number;
  cancelledItems?: number;
  onReset?: () => void;
  onExportCSV?: () => void;
  onSearchSubmit?: () => void;
}

export function LeaveFilters({
  searchTerm,
  onSearchChange,
  statusFilter = "all",
  onStatusChange,
  typeFilter,
  onTypeChange,
  typeOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  totalItems,
  approvedItems,
  pendingItems,
  rejectedItems,
  cancelledItems,
  onReset,
  onExportCSV,
  onSearchSubmit,
}: LeaveFiltersProps) {
  const showChips = approvedItems !== undefined;
  return (
    <div className="space-y-6 mb-8">
      {/* Top Row: Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl"
            placeholder="ค้นหารหัสพนักงาน..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input
            type="date"
            className="h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl w-full md:w-[160px]"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
          <span className="text-slate-400 font-medium">ถึง</span>
          <Input
            type="date"
            className="h-11 border-slate-200 focus-visible:ring-[#1a1a40] rounded-xl w-full md:w-[160px]"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
          />
        </div>

        <div className="w-full md:w-auto">
          <Select value={typeFilter} onValueChange={onTypeChange}>
            <SelectTrigger className="w-full md:w-[180px] !h-11 border-slate-200 rounded-xl">
              <SelectValue placeholder="ประเภทการลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ประเภทการลา: ทั้งหมด</SelectItem>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onStatusChange && (
          <div className="w-full md:w-auto">
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full md:w-[180px] !h-11 border-slate-200 rounded-xl">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">สถานะ: ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอการอนุมัติ</SelectItem>
                <SelectItem value="approved">ได้รับการอนุมัติ</SelectItem>
                <SelectItem value="rejected">ไม่ได้รับการอนุมัติ</SelectItem>
                <SelectItem value="cancelled">คำขอนี้ถูกยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {onSearchSubmit && (
          <Button onClick={onSearchSubmit} className="h-11 px-6 rounded-xl">
            ค้นหา
          </Button>
        )}
      </div>

      {/* Bottom Row: Summary + Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6 border-t border-slate-100">
        {showChips ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 font-medium whitespace-nowrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
              <span>ทั้งหมด <span className="text-[#1a1a40] font-bold">{totalItems}</span> รายการ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-green-600">อนุมัติ {approvedItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span className="text-blue-600">รออนุมัติ {pendingItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              <span className="text-red-500">ไม่อนุมัติ {rejectedItems}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
              <span className="text-black">ยกเลิก {cancelledItems}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
            ทั้งหมด <span className="text-[#1a1a40] font-bold">{totalItems}</span> รายการ
          </div>
        )}
        <div className="flex items-center gap-3">
          {onReset && (
            <Button
              variant="ghost"
              onClick={onReset}
              className="h-11 px-4 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-black-500"
            >
              ล้างตัวกรอง
            </Button>
          )}
          {onExportCSV && (
            <Button
              variant="outline"
              onClick={onExportCSV}
              className="h-11 px-4 flex items-center gap-2 rounded-xl"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
