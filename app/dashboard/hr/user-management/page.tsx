"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useFilterWithApply } from "@/hooks/useFilterWithApply";
import { Search, KeyRound, ToggleLeft, ToggleRight, History, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { toast } from "sonner";

type UserListItem = {
  userId: string;
  staffId: string;
  email: string | null;
  isActive: boolean;
  forceChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  staffCode: string;
  staffName: string;
  departmentName: string | null;
  positionName: string | null;
  roleNames: string[];
};



type LoginHistoryItem = {
  loginHistoryId: string;
  loginAt: string;
  isSuccess: boolean;
  loginMethod: string;
  ipAddress: string | null;
  deviceInfo: string | null;
};

export default function UserManagementPage() {
  const [fetchKey, setFetchKey] = useState(0);

  const { live: { search, activeFilter }, setFilter, applied: appliedFilters, page, setPage, submit: handleSearchSubmit, reset: handleReset } = useFilterWithApply({
    search: "",
    activeFilter: "all",
  });

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  const [resetTarget, setResetTarget] = useState<UserListItem | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetPasswordResult, setResetPasswordResult] = useState("");

  const [historyTarget, setHistoryTarget] = useState<UserListItem | null>(null);
  const [historyData, setHistoryData] = useState<LoginHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [passwordCopied, setPasswordCopied] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (appliedFilters.search) params.set("search", appliedFilters.search);
      if (appliedFilters.activeFilter !== "all") params.set("isActive", appliedFilters.activeFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/hr/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users");
      const json = await res.json();
      const d = json.data;
      setUsers(d.users ?? []);
      setTotal(d.total ?? 0);
      setTotalPages(Math.ceil((d.total ?? 0) / 20) || 1);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers, fetchKey]);

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/hr/users/${resetTarget.userId}/reset-password`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reset password");
      }
      const json = await res.json();
      setResetPasswordResult(json.data.password);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setResetting(false);
    }
  };

  const handleToggleActive = async (user: UserListItem) => {
    setTogglingIds((prev) => [...prev, user.userId]);
    try {
      const res = await fetch(`/api/hr/users/${user.userId}/toggle-active`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to toggle active");
      }
      setUsers((prev) =>
        prev.map((u) => (u.userId === user.userId ? { ...u, isActive: !u.isActive } : u)),
      );
      toast.success(!user.isActive ? "เปิดใช้งานผู้ใช้เรียบร้อย" : "ปิดใช้งานผู้ใช้เรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== user.userId));
    }
  };

  const openHistoryDialog = async (user: UserListItem) => {
    setHistoryTarget(user);
    setHistoryLoading(true);
    setHistoryData([]);
    try {
      const res = await fetch(`/api/hr/users/${user.userId}/login-history`);
      if (!res.ok) throw new Error("Failed to load history");
      const json = await res.json();
      setHistoryData(json.data ?? []);
    } catch {
      toast.error("ไม่สามารถโหลดประวัติการเข้าใช้ได้");
    } finally {
      setHistoryLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการผู้ใช้" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการผู้ใช้</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage user accounts and login access.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
                placeholder="ค้นหาพนักงาน..."
                value={search}
                onChange={(e) => setFilter("search", e.target.value)}
              />
            </div>
            
            <select
              className="h-11 border border-[#c8c5d0] rounded-lg px-3 text-[14px] bg-white focus-visible:ring-secondary/20 outline-none"
              value={activeFilter}
              onChange={(e) => setFilter("activeFilter", e.target.value)}
            >
              <option value="all">ทั้งหมด</option>
              <option value="true">เปิดใช้งาน</option>
              <option value="false">ปิดใช้งาน</option>
            </select>
            <Button
              type="button"
              onClick={handleSearchSubmit}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Search className="w-[18px] h-[18px]" />
              ค้นหา
            </Button>

          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">User List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {total} users</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
          ) : error ? (
            <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table containerClassName="max-h-[600px] overflow-y-auto">
                <TableHeader className="sticky top-0 z-10 bg-[#1e1b4b]">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase w-12">ลำดับ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">รหัสพนักงาน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">อีเมล</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">บทบาท</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สถานะ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] text-nowrap uppercase">บังคับเปลี่ยนรหัส</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">เข้าสู่ระบบล่าสุด</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สร้างเมื่อ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {users.length > 0 ? (
                    users.map((user, idx) => (
                      <TableRow key={user.userId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-[#787680] whitespace-nowrap">{(page - 1) * 20 + idx + 1}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold text-[#070235] whitespace-nowrap">{user.staffCode}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{user.staffName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{user.email ?? "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {user.roleNames.map((role, i) => (
                              <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-[#eff4ff] text-[#4648d4] border border-[#d0d5f0]">
                                {role}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold whitespace-nowrap ${user.forceChangePassword ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
                            {user.forceChangePassword ? "ใช่" : "ไม่"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap text-[#47464f]">{formatDate(user.lastLoginAt)}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap text-[#47464f]">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              title="รีเซ็ตรหัสผ่าน"
                              onClick={() => { setResetTarget(user); setResetPasswordResult(""); }}
                            >
                              <KeyRound className="w-[18px] h-[18px]" />
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                              title={user.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                              disabled={togglingIds.includes(user.userId)}
                              onClick={() => handleToggleActive(user)}
                            >
                              {togglingIds.includes(user.userId) ? (
                                <Loader2 className="w-[18px] h-[18px] animate-spin" />
                              ) : user.isActive ? (
                                <ToggleRight className="w-[18px] h-[18px]" />
                              ) : (
                                <ToggleLeft className="w-[18px] h-[18px]" />
                              )}
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              title="ประวัติการเข้าใช้"
                              onClick={() => openHistoryDialog(user)}
                            >
                              <History className="w-[18px] h-[18px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลผู้ใช้</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ก่อนหน้า
            </Button>
            <span className="text-[14px] text-[#47464f]">
              หน้า {page} จาก {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ถัดไป
            </Button>
          </div>
        )}





        <Dialog open={!!resetTarget && !resetPasswordResult} onOpenChange={(o) => { if (!o) { setResetTarget(null); setResetPasswordResult(""); } }}>
          <DialogContent className="sm:max-w-[480px] !rounded-xl !p-0 overflow-hidden gap-0 shadow-xl">
            <DialogTitle className="sr-only">รีเซ็ตรหัสผ่าน</DialogTitle>
            <div className="h-2 w-full bg-[#6063ee]"></div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#e1e0ff] rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#4648d4]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                </svg>
              </div>
              <h2 className="text-[24px] font-bold leading-[32px] tracking-[-0.02em] text-[#111c2d] mb-1">รีเซ็ตรหัสผ่าน</h2>
              <p className="text-[16px] leading-[24px] text-[#505f76] mb-6">ยืนยันการรีเซ็ตรหัสผ่านสำหรับ {resetTarget?.staffName}</p>
              <div className="w-full bg-[#f0f3ff] p-4 rounded-lg border border-[#c7c4d7] text-left mb-8">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-[#4648d4] mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-[14px] leading-[20px] text-[#464554]">
                    คุณต้องการรีเซ็ตรหัสผ่านของ <span className="font-semibold text-[#111c2d]">{resetTarget?.staffName} ({resetTarget?.staffCode})</span> ใช่หรือไม่?
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse md:flex-row w-full gap-4 md:justify-end">
                <Button
                  onClick={() => { setResetTarget(null); setResetPasswordResult(""); }}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg border border-[#767586] text-[#111c2d] text-[14px] font-semibold leading-[20px] hover:bg-[#d8e3fb] transition-colors cursor-pointer active:scale-95 duration-100"
                >
                  ยกเลิก
                </Button>
                <Button
                  disabled={resetting}
                  onClick={handleResetPassword}
                  className="w-full md:w-auto px-6 py-2.5 rounded-lg bg-[#6063ee] text-white text-[14px] font-semibold leading-[20px] hover:brightness-110 shadow-sm transition-all cursor-pointer active:scale-95 duration-100 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <Loader2 className="w-[18px] h-[18px] animate-spin" />
                  ) : (
                    <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
                    </svg>
                  )}
                  {resetting ? "กำลังดำเนินการ..." : "ยืนยันรีเซ็ต"}
                </Button>
              </div>
            </div>
            <div className="px-6 py-3 bg-[#e7eeff] border-t border-[#c7c4d7] flex justify-between items-center">
              <span className="text-[12px] leading-[16px] tracking-[0.02em] font-medium text-[#464554] flex items-center gap-1">
                <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                Protected action
              </span>
              <span className="text-[12px] leading-[16px] tracking-[0.02em] font-medium text-[#767586]">
                ID: {resetTarget?.userId?.slice(0, 8).toUpperCase() ?? "—"}
              </span>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!resetPasswordResult} onOpenChange={(o) => { if (!o) { setResetTarget(null); setResetPasswordResult(""); setPasswordCopied(false); } }}>
          <DialogContent className="sm:max-w-[480px] !rounded-xl !p-0 overflow-hidden gap-0 shadow-xl">
            <DialogTitle className="sr-only">รีเซ็ตรหัสผ่านสำเร็จ</DialogTitle>
            <div className="h-2 w-full bg-[#6063ee]"></div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#e1e0ff] rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-[#4648d4]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h2 className="text-[24px] font-bold leading-[32px] tracking-[-0.02em] text-[#111c2d] mb-1">รีเซ็ตรหัสผ่านสำเร็จ</h2>
              <p className="text-[16px] leading-[24px] text-[#505f76] mb-6">รหัสผ่านใหม่สำหรับ {resetTarget?.staffName}</p>
              <div className="w-full bg-[#f0f3ff] border border-[#c7c4d7] rounded-lg p-4 text-center mb-4">
                <p className="text-[13px] text-[#464554] font-medium mb-2">รหัสผ่านใหม่</p>
                <p className="text-[22px] font-bold text-[#111c2d] tracking-wider font-mono select-all">{resetPasswordResult}</p>
              </div>
              <Button
                onClick={() => copyToClipboard(resetPasswordResult)}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-[#767586] text-[#111c2d] text-[14px] font-semibold leading-[20px] hover:bg-[#d8e3fb] transition-colors cursor-pointer active:scale-95 duration-100 mb-2"
              >
                {passwordCopied ? (
                  <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                )}
                {passwordCopied ? "คัดลอกแล้ว" : "คัดลอก"}
              </Button>
            </div>
            <div className="px-6 py-3 bg-[#e7eeff] border-t border-[#c7c4d7] flex justify-between items-center">
              <span className="text-[12px] leading-[16px] tracking-[0.02em] font-medium text-[#464554] flex items-center gap-1">
                <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
                Protected action
              </span>
              <Button
                onClick={() => { setResetTarget(null); setResetPasswordResult(""); setPasswordCopied(false); }}
                className="text-[14px] font-semibold leading-[20px] text-[#4648d4] hover:underline"
              >
                ปิด
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!historyTarget} onOpenChange={(o) => { if (!o) setHistoryTarget(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>ประวัติการเข้าใช้</DialogTitle>
              <DialogDescription>
                {historyTarget?.staffName} ({historyTarget?.staffCode})
              </DialogDescription>
            </DialogHeader>
            {historyLoading ? (
              <div className="flex justify-center items-center py-10 text-[#47464f]">กำลังโหลด...</div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-10 text-[#47464f]">ไม่มีประวัติการเข้าใช้</div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-[#1e1b4b]">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="text-white font-semibold px-4 py-3 text-[12px] uppercase">วันที่</TableHead>
                      <TableHead className="text-white font-semibold px-4 py-3 text-[12px] uppercase">สถานะ</TableHead>
                      <TableHead className="text-white font-semibold px-4 py-3 text-[12px] uppercase">วิธีการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-[#c8c5d0]">
                    {historyData.map((item) => (
                      <TableRow key={item.loginHistoryId} className="hover:bg-[#eff4ff]/30">
                        <TableCell className="px-4 py-3 text-[13px] whitespace-nowrap">{formatDate(item.loginAt)}</TableCell>
                        <TableCell className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${item.isSuccess ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}`}>
                            {item.isSuccess ? "สำเร็จ" : "ล้มเหลว"}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[13px] whitespace-nowrap">{item.loginMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end mt-2">
              <Button variant="outline" onClick={() => setHistoryTarget(null)}>ปิด</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardContent>
    </div>
  );
}
