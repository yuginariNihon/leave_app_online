"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Repeat, Search, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { toast } from "sonner";

type HolidayItem = {
  holidayId: string;
  holidayName: string;
  holidayDate: string;
  isRecurring: boolean;
};

export default function HolidaysPage() {
  const [fetchKey, setFetchKey] = useState(0);
  const [data, setData] = useState<HolidayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showImport, setShowImport] = useState(false);
  const [importRows, setImportRows] = useState<{ holidayName: string; holidayDate: string; isRecurring: boolean }[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ row: number; status: "ok" | "error"; message: string }[]>([]);
  const [importFileName, setImportFileName] = useState("");

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/hr/holidays");
        if (!res.ok) throw new Error("Failed to load holidays");
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลวันหยุดได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (h) =>
      h.holidayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.holidayDate.includes(searchTerm),
  );

  const resetForm = () => {
    setFormName("");
    setFormDate("");
    setFormRecurring(false);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (item: HolidayItem) => {
    setFormName(item.holidayName);
    setFormDate(item.holidayDate);
    setFormRecurring(item.isRecurring);
    setEditingId(item.holidayId);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDate) {
      toast.error("กรุณากรอกชื่อวันหยุดและวันที่");
      return;
    }
    setSaving(true);
    try {
      const body = {
        holidayName: formName.trim(),
        holidayDate: formDate,
        isRecurring: formRecurring,
      };

      if (editingId) {
        const res = await fetch(`/api/hr/holidays/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update");
        }
        toast.success("แก้ไขวันหยุดเรียบร้อย");
      } else {
        const res = await fetch("/api/hr/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create");
        }
        toast.success("เพิ่มวันหยุดเรียบร้อย");
      }
      resetForm();
      setFetchKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`คุณต้องการลบวันหยุด "${name}" ใช่หรือไม่?`)) return;
    try {
      const res = await fetch(`/api/hr/holidays/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("ลบวันหยุดเรียบร้อย");
      setFetchKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการวันหยุด" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการวันหยุด</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage company holidays and observances.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
                placeholder="ค้นหาวันหยุด..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => { setImportRows([]); setImportResults([]); setImportFileName(""); setShowImport(true); }}
              variant="outline"
              className="h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 rounded-lg"
            >
              <Upload className="w-[18px] h-[18px]" />
              นำเข้า CSV
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-[18px] h-[18px]" />
              เพิ่มวันหยุด
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={resetForm}>
            <div className="w-full max-w-[520px] bg-white rounded-xl shadow-xl border border-[#c8c5d0] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#c8c5d0]">
                <h3 className="text-[18px] font-bold text-[#070235]">
                  {editingId ? "แก้ไขวันหยุด" : "เพิ่มวันหยุดใหม่"}
                </h3>
                <button onClick={resetForm} className="text-[#787680] hover:text-[#070235] transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#47464f] mb-1">ชื่อวันหยุด</label>
                  <Input
                    className="h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px]"
                    placeholder="เช่น วันปีใหม่"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#47464f] mb-1">วันที่</label>
                  <Input
                    type="date"
                    className="h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px]"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formRecurring}
                    onChange={(e) => setFormRecurring(e.target.checked)}
                    className="w-4 h-4 accent-[#6063ee]"
                  />
                  <span className="text-[14px] text-[#47464f]">วันหยุดประจำปี (ซ้ำทุกปี)</span>
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#f8f9ff] border-t border-[#c8c5d0]">
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="h-10 px-5 text-[12px] tracking-[0.05em] uppercase rounded-lg"
                >
                  ยกเลิก
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-10 px-5 text-[12px] tracking-[0.05em] uppercase shadow-sm"
                >
                  {saving ? "กำลังบันทึก..." : editingId ? "บันทึก" : "เพิ่ม"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import CSV Modal */}
        {showImport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowImport(false)}>
            <div className="w-full max-w-[640px] bg-white rounded-xl shadow-xl border border-[#c8c5d0] mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#c8c5d0]">
                <h3 className="text-[18px] font-bold text-[#070235]">นำเข้าข้อมูลวันหยุดจาก CSV</h3>
                <button onClick={() => setShowImport(false)} className="text-[#787680] hover:text-[#070235] transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="border-2 border-dashed border-[#c8c5d0] rounded-xl p-8 text-center hover:border-[#6063ee] transition-colors cursor-pointer" onClick={() => document.getElementById("csv-upload")?.click()}>
                  <Upload className="w-10 h-10 text-[#787680] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#070235]">คลิกเพื่อเลือกไฟล์ CSV</p>
                  <p className="text-xs text-[#787680] mt-1">หรือลากไฟล์มาวางที่นี่</p>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setImportFileName(file.name);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const text = ev.target?.result as string;
                        const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
                        if (lines.length < 2) {
                          toast.error("ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว");
                          return;
                        }
                        const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
                        const nameIdx = header.findIndex((h) => h === "holidayname" || h === "ชื่อวันหยุด");
                        const dateIdx = header.findIndex((h) => h === "holidaydate" || h === "วันที่");
                        const recurringIdx = header.findIndex((h) => h === "isrecurring" || h === "is_recurring" || h === "ซ้ำทุกปี");
                        if (nameIdx === -1 || dateIdx === -1) {
                          toast.error("ไฟล์ CSV ต้องมีคอลัมน์ holidayName และ holidayDate");
                          return;
                        }
                        const rows = lines.slice(1).map((line) => {
                          const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
                          return {
                            holidayName: cols[nameIdx] || "",
                            holidayDate: cols[dateIdx] || "",
                            isRecurring: recurringIdx !== -1 ? cols[recurringIdx]?.toLowerCase() === "true" || cols[recurringIdx] === "1" : false,
                          };
                        }).filter((r) => r.holidayName && r.holidayDate);
                        setImportRows(rows);
                        setImportResults([]);
                      };
                      reader.readAsText(file);
                    }}
                  />
                </div>
                {importFileName && (
                  <p className="text-xs text-[#47464f]">ไฟล์: {importFileName} &bull; {importRows.length} รายการ</p>
                )}
                {importRows.length > 0 && (
                  <div className="max-h-[200px] overflow-y-auto border border-[#c8c5d0] rounded-lg">
                    <table className="w-full text-[13px]">
                      <thead className="bg-[#f8f9ff] sticky top-0">
                        <tr className="border-b border-[#c8c5d0]">
                          <th className="text-left px-3 py-2 font-semibold text-[#47464f]">#</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#47464f]">ชื่อวันหยุด</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#47464f]">วันที่</th>
                          <th className="text-left px-3 py-2 font-semibold text-[#47464f]">ประเภท</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#c8c5d0]">
                        {importRows.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-[#787680]">{i + 1}</td>
                            <td className="px-3 py-2 font-medium text-[#070235]">{r.holidayName}</td>
                            <td className="px-3 py-2 text-[#47464f]">{r.holidayDate}</td>
                            <td className="px-3 py-2">{r.isRecurring ? <span className="text-indigo-600 font-medium">ประจำปี</span> : <span className="text-slate-500">ครั้งเดียว</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {importResults.length > 0 && (
                  <div className="max-h-[150px] overflow-y-auto border border-[#c8c5d0] rounded-lg bg-[#f8f9ff]">
                    {importResults.map((r, i) => (
                      <div key={i} className={`px-3 py-1.5 text-xs border-b border-[#c8c5d0]/50 last:border-0 ${r.status === "ok" ? "text-green-700" : "text-red-600"}`}>
                        แถวที่ {r.row}: {r.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[#f8f9ff] border-t border-[#c8c5d0]">
                <Button onClick={() => setShowImport(false)} variant="outline" className="h-10 px-5 text-[12px] tracking-[0.05em] uppercase rounded-lg">
                  ปิด
                </Button>
                {importRows.length > 0 && (
                  <Button
                    onClick={async () => {
                      setImporting(true);
                      setImportResults([]);
                      const results: { row: number; status: "ok" | "error"; message: string }[] = [];
                      for (let i = 0; i < importRows.length; i++) {
                        const r = importRows[i];
                        try {
                          const res = await fetch("/api/hr/holidays", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ holidayName: r.holidayName, holidayDate: r.holidayDate, isRecurring: r.isRecurring }),
                          });
                          if (res.ok) {
                            results.push({ row: i + 1, status: "ok", message: `"${r.holidayName}" เพิ่มสำเร็จ` });
                          } else {
                            const err = await res.json();
                            results.push({ row: i + 1, status: "error", message: err.error || `"${r.holidayName}" ล้มเหลว` });
                          }
                        } catch {
                          results.push({ row: i + 1, status: "error", message: `"${r.holidayName}" เกิดข้อผิดพลาด` });
                        }
                        setImportResults([...results]);
                      }
                      setImporting(false);
                      if (results.every((r) => r.status === "ok")) {
                        toast.success(`นำเข้าสำเร็จ ${results.length} รายการ`);
                        setShowImport(false);
                        setFetchKey((k) => k + 1);
                      } else {
                        const ok = results.filter((r) => r.status === "ok").length;
                        const err = results.filter((r) => r.status === "error").length;
                        toast.error(`นำเข้า ${ok} สำเร็จ, ${err} ล้มเหลว`);
                      }
                    }}
                    disabled={importing}
                    className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-10 px-5 text-[12px] tracking-[0.05em] uppercase shadow-sm"
                  >
                    {importing ? `กำลังนำเข้า... (${importResults.length}/${importRows.length})` : `นำเข้า ${importRows.length} รายการ`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Holiday List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} holidays</span>
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
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">วันที่</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อวันหยุด</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ประเภท</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {filtered.length > 0 ? (
                    filtered.map((holiday) => (
                      <TableRow key={holiday.holidayId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-[16px] h-[16px] text-[#787680]" />
                            <span className="font-medium text-[#070235]">{holiday.holidayDate}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold text-[#070235] whitespace-nowrap">
                          {holiday.holidayName}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {holiday.isRecurring ? (
                            <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border bg-indigo-50 text-indigo-700 border-indigo-100">
                              <Repeat className="w-[12px] h-[12px]" />
                              วันหยุดประจำปี
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border bg-slate-100 text-slate-600 border-slate-200">
                              วันหยุดครั้งเดียว
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              onClick={() => openEdit(holiday)}
                            >
                              <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                              onClick={() => handleDelete(holiday.holidayId, holiday.holidayName)}
                            >
                              <Trash2 className="w-[20px] h-[20px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลวันหยุด</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DashboardContent>
    </div>
  );
}
