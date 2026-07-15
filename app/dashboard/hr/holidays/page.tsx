"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, Repeat, Search } from "lucide-react";
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
          <div className="mb-6 bg-white rounded-xl border border-[#c8c5d0] shadow-lg p-6">
            <h3 className="text-[16px] font-semibold text-[#070235] mb-4">
              {editingId ? "แก้ไขวันหยุด" : "เพิ่มวันหยุดใหม่"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div className="flex items-end pb-3">
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
            </div>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-10 px-5 text-[12px] tracking-[0.05em] uppercase shadow-sm"
              >
                {saving ? "กำลังบันทึก..." : editingId ? "บันทึก" : "เพิ่ม"}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="h-10 px-5 text-[12px] tracking-[0.05em] uppercase rounded-lg"
              >
                ยกเลิก
              </Button>
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
