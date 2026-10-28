import type { ReactNode } from "react";
import { Download, FileText, Pencil, Plus, Power, PowerOff, Search } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BreadcrumbItem = { label: string; href?: string };

export type MasterDataColumn<T> = {
  key: string;
  header: ReactNode;
  align?: "left" | "center";
  cell: (row: T) => ReactNode;
  className?: string;
};

type MasterDataListPageProps<T> = {
  breadcrumb: BreadcrumbItem[];
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  addLabel: string;
  onAdd: () => void;
  onExport?: () => void;
  data: T[];
  loading: boolean;
  error: string;
  emptyMessage: string;
  countText: (count: number) => string;
  columns: MasterDataColumn<T>[];
  rowKey: (row: T) => string;
  renderActions?: (row: T) => ReactNode;
  footer?: ReactNode;
};

const HEAD_CLASS =
  "text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase";
const CELL_CLASS = "px-6 py-4 text-[14px] leading-[20px]";

export function MasterDataListPage<T>({
  breadcrumb,
  title,
  subtitle,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  addLabel,
  onAdd,
  onExport,
  data,
  loading,
  error,
  emptyMessage,
  countText,
  columns,
  rowKey,
  renderActions,
  footer,
}: MasterDataListPageProps<T>) {
  const columnCount = columns.length + (renderActions ? 1 : 0);

  return (
    <>
      <AppBreadcrumb items={breadcrumb} className="mb-4" />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
        <div>
          <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">{title}</h1>
          <p className="text-[14px] leading-[20px] text-[#47464f]">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
            <Input
              className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-full md:w-[200px]"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          {onExport && (
            <Button
              variant="outline"
              onClick={onExport}
              className="h-11 px-4 rounded-lg text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 border-[#c8c5d0] text-[#47464f] hover:bg-slate-50 hover:text-[#070235]"
            >
              <Download className="w-[18px] h-[18px]" />
              Export
            </Button>
          )}
          <Button
            onClick={onAdd}
            className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-[18px] h-[18px]" />
            {addLabel}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#c8c5d0] flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
          <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
          <span className="text-[13px] leading-[18px] text-[#47464f] italic">{countText(data.length)}</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <Table containerClassName="max-h-[500px] overflow-y-auto">
              <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
                <TableRow className="hover:bg-transparent border-none">
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${HEAD_CLASS} ${column.align === "center" ? "text-center" : ""}`}
                    >
                      {column.header}
                    </TableHead>
                  ))}
                  {renderActions && (
                    <TableHead className={`${HEAD_CLASS} text-center`}>จัดการ</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#c8c5d0]">
                {data.length > 0 ? (
                  data.map((row) => (
                    <TableRow key={rowKey(row)} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          className={`${CELL_CLASS} ${column.align === "center" ? "text-center" : ""} whitespace-nowrap ${column.className ?? ""}`}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}
                      {renderActions && (
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            {renderActions(row)}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="text-center py-20 text-[#47464f]">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 opacity-20" />
                        <span>{emptyMessage}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {footer}
      </div>
    </>
  );
}

export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

export function CountPill({ children }: { children: ReactNode }) {
  return (
    <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">
      {children}
    </span>
  );
}

export function EntityRowActions({
  onEdit,
  onToggle,
  toggling,
  isActive,
}: {
  onEdit: () => void;
  onToggle: () => void;
  toggling: boolean;
  isActive: boolean;
}) {
  return (
    <>
      <Button
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
        onClick={onEdit}
      >
        <Pencil className="w-[20px] h-[20px]" />
      </Button>
      <Button
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
        disabled={toggling}
        onClick={onToggle}
      >
        {isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
      </Button>
    </>
  );
}
