"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Pencil, Power, PowerOff, FileText, Loader2, Save, UserCog } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import type { RoleManageItem } from "@/lib/services/leaveService";
import { toast } from "sonner";

const SYSTEM_ROLE_NAMES = ["SUPER_ADMIN", "HR", "APPROVER", "EMPLOYEE"];

export default function ManageRolesPage() {
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<RoleManageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RoleManageItem | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState("");

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
        const res = await fetch("/api/admin/roles");
        if (!res.ok) throw new Error("Failed to load roles");
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลบทบาทได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter((r) =>
    r.roleName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const openAdd = () => {
    setEditing(null);
    setNameInput("");
    setSavingError("");
    setFormOpen(true);
  };

  const openEdit = (role: RoleManageItem) => {
    setEditing(role);
    setNameInput(role.roleName);
    setSavingError("");
    setFormOpen(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setSavingError("กรุณากรอกชื่อบทบาท");
      return;
    }
    setSaving(true);
    setSavingError("");
    try {
      const res = editing
        ? await fetch(`/api/admin/roles/${editing.roleId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleName: trimmed }),
          })
        : await fetch("/api/admin/roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roleName: trimmed }),
          });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");

      setFormOpen(false);
      setFetchKey((k) => k + 1);
      toast.success(editing ? "แก้ไขบทบาทเรียบร้อย" : "เพิ่มบทบาทเรียบร้อย");
    } catch (err) {
      setSavingError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (role: RoleManageItem) => {
    setTogglingIds((prev) => [...prev, role.roleId]);
    try {
      const res = await fetch(`/api/admin/roles/${role.roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !role.isActive }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to toggle");
      setData((prev) =>
        prev.map((r) => (r.roleId === role.roleId ? { ...r, isActive: !role.isActive } : r)),
      );
      toast.success(!role.isActive ? "เปิดใช้งานบทบาทเรียบร้อย" : "ปิดใช้งานบทบาทเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== role.roleId));
    }
  };

  return (
    <>

      <AppBreadcrumb
        items={[
          { label: "Home", href: "/dashboard" },
          { label: "Admin" },
          { label: "จัดการบทบาท" },
        ]}
        className="mb-4"
      />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
        <div>
          <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการบทบาท</h1>
          <p className="text-[14px] leading-[20px] text-[#47464f]">Create, rename and toggle roles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
            <Input
              className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-full md:w-[200px]"
              placeholder="ค้นหาชื่อบทบาท..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={openAdd}
            className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-[18px] h-[18px]" />
            Add Role
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
          <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
          <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} roles</span>
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
                  <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อบทบาท</TableHead>
                  <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนพนักงาน</TableHead>
                  <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สถานะ</TableHead>
                  <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">ประเภท</TableHead>
                  <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-[#c8c5d0]">
                {filtered.length > 0 ? (
                  filtered.map((role) => {
                    const isSystemRole = SYSTEM_ROLE_NAMES.includes(role.roleName.toUpperCase());
                    return (
                      <TableRow key={role.roleId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold text-[#070235] whitespace-nowrap">{role.roleName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{role.staffCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${role.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${role.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {role.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {isSystemRole ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] border bg-[#1a1a40]/5 text-[#1a1a40] border-[#1a1a40]/15">
                              บทบาทระบบ
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] border bg-sky-50 text-sky-700 border-sky-100">
                              บทบาทที่กำหนดเอง
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={isSystemRole}
                              onClick={() => openEdit(role)}
                            >
                              <Pencil className="w-[20px] h-[20px]" />
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={togglingIds.includes(role.roleId) || (isSystemRole && role.isActive)}
                              onClick={() => handleToggleActive(role)}
                            >
                              {role.isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-[#47464f]">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-10 h-10 opacity-20" />
                        <span>ไม่พบข้อมูลบทบาท</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={(open) => { if (!saving) setFormOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-[#1a1a40]" />
              {editing ? `แก้ไขบทบาท: ${editing.roleName}` : "เพิ่มบทบาทใหม่"}
            </DialogTitle>
            <DialogDescription>
              {editing ? "เปลี่ยนชื่อบทบาท โดยไม่กระทบสิทธิ์เดิม" : "สร้างบทบาทใหม่ แล้วตั้งสิทธิ์การเข้าถึงหน้าในเมนูจัดการสิทธิ์การเข้าถึงหน้า"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
                ชื่อบทบาท
                <span className="text-[#ba1a1a] text-xs">*</span>
              </label>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); }}
                className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                placeholder="เช่น Supervisor"
                autoFocus
              />
            </div>
            {savingError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {savingError}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              className="text-[#45464d] hover:text-[#0F172A] font-semibold rounded-xl h-11 min-w-[100px] border border-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setFormOpen(false)}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="bg-[#1a1a40] hover:bg-[#2a2a5a] text-white font-semibold rounded-xl h-11 min-w-[100px] transition-all active:scale-95"
              onClick={handleSaveName}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}