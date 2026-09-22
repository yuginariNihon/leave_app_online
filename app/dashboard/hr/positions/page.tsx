"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Pencil, Power, PowerOff, FileText, ArrowUpDown, ArrowUp, ArrowDown, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { apiFetch } from "@/lib/api";
import type { PositionListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";

export default function PositionsPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<PositionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [levelSortDir, setLevelSortDir] = useState<"asc" | "desc" | null>(null);
  const [canManageDefaultRole, setCanManageDefaultRole] = useState(false);
  const [activeRoles, setActiveRoles] = useState<{ role_id: string; role_name: string }[]>([]);
  const [draft, setDraft] = useState<Record<string, string | null>>({});
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
        const json = await apiFetch<{
          data: PositionListItem[];
          meta: { canManageDefaultRole?: boolean; activeRoles?: { role_id: string; role_name: string }[] };
        }>("/api/hr/positions");
        if (!cancelled) {
          setData(json.data);
          setCanManageDefaultRole(json.meta?.canManageDefaultRole ?? false);
          setActiveRoles(json.meta?.activeRoles ?? []);
        }
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (p) =>
      p.positionName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (!levelSortDir) return 0;
    const aVal = a.positionLevel ?? 999999;
    const bVal = b.positionLevel ?? 999999;
    return levelSortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/positions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((p) => (p.positionId === id ? { ...p, isActive: !currentActive } : p)),
      );
      toast.success(!currentActive ? "เปิดใช้งานตำแหน่งเรียบร้อย" : "ปิดใช้งานตำแหน่งเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const handleSaveAll = async () => {
    const entries = data.filter((p) => Object.prototype.hasOwnProperty.call(draft, p.positionId));
    if (entries.length === 0) return;
    setSaving(true);
    let ok = 0;
    const errors: string[] = [];
    await Promise.all(
      entries.map(async (p) => {
        try {
          await apiFetch(`/api/admin/positions/${p.positionId}/default-role`, {
            method: "PUT",
            body: JSON.stringify({ defaultRoleId: draft[p.positionId] ?? null }),
          });
          ok++;
        } catch (err) {
          errors.push(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        }
      }),
    );
    if (ok > 0) {
      setData((prev) =>
        prev.map((p) => {
          if (!Object.prototype.hasOwnProperty.call(draft, p.positionId)) return p;
          const roleId = draft[p.positionId];
          const roleName = roleId ? activeRoles.find((r) => r.role_id === roleId)?.role_name ?? null : null;
          return { ...p, defaultRoleId: roleId, defaultRoleName: roleName };
        }),
      );
      toast.success(`บันทึกบทบาทเริ่มต้นแล้ว ${ok} รายการ`);
    }
    if (errors.length > 0) toast.error(errors[0]);
    setDraft({});
    setSaving(false);
  };

  const changedCount = data.filter((p) => Object.prototype.hasOwnProperty.call(draft, p.positionId)).length;

  return (
        <>

        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการตำแหน่ง" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการตำแหน่ง</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">Manage organizational positions and hierarchies.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
              <Input
                className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-full md:w-[200px]"
                placeholder="ค้นหาชื่อตำแหน่ง..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => router.push("/dashboard/hr/positions/add")}
              className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-11 px-4 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-[18px] h-[18px]" />
              Add Position
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex flex-wrap items-center justify-between gap-2 bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">Master List</h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} positions</span>
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
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อตำแหน่ง</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">บทบาทเริ่มต้น</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center cursor-pointer select-none" onClick={() => setLevelSortDir(levelSortDir === "asc" ? "desc" : levelSortDir === "desc" ? null : "asc")}>
                      <div className="flex items-center justify-center gap-1">
                        ระดับตำแหน่ง
                        {levelSortDir === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : levelSortDir === "desc" ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
                      </div>
                    </TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จำนวนพนักงาน</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">สถานะ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {filtered.length > 0 ? (
                    sorted.map((pos) => {
                      const isDirty = Object.prototype.hasOwnProperty.call(draft, pos.positionId);
                      const stagedRoleId = isDirty ? draft[pos.positionId] : pos.defaultRoleId;
                      const selectValue = stagedRoleId && activeRoles.some((r) => r.role_id === stagedRoleId) ? stagedRoleId : "none";
                      return (
                      <TableRow key={pos.positionId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{pos.positionName}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">
                          {canManageDefaultRole ? (
                            <div className="flex items-center gap-2">
                              {isDirty && <span className="w-2 h-2 rounded-full bg-[#6063ee] shrink-0" />}
                              <Select
                                value={selectValue}
                                disabled={saving}
                                onValueChange={(val) => setDraft((prev) => ({ ...prev, [pos.positionId]: val === "none" ? null : val }))}
                              >
                                <SelectTrigger className="h-8 w-[180px] text-[13px]">
                                  <SelectValue placeholder="— ไม่ระบุ —" />
                                </SelectTrigger>
                                <SelectContent position="popper" side="bottom" sideOffset={4}>
                                  <SelectItem value="none">— ไม่ระบุ —</SelectItem>
                                  {activeRoles.map((r) => (
                                    <SelectItem key={r.role_id} value={r.role_id}>{r.role_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : pos.defaultRoleName ? (
                            <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">
                              {pos.defaultRoleName}
                            </span>
                          ) : (
                            <span className="text-[#a3a0ad]">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">{pos.positionLevel ?? "-"}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-3 py-1 rounded-full text-slate-600 font-medium text-[13px]">{pos.staffCount}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-4 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${pos.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pos.isActive ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                            {pos.isActive ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              onClick={() => router.push(`/dashboard/hr/positions/edit?positionId=${pos.positionId}`)}
                            >
                              <Pencil className="w-[20px] h-[20px]" />
                            </Button>
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all"
                              disabled={togglingIds.includes(pos.positionId)}
                              onClick={() => handleToggleActive(pos.positionId, pos.isActive)}
                            >
                              {pos.isActive ? <PowerOff className="w-[20px] h-[20px]" /> : <Power className="w-[20px] h-[20px]" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลตำแหน่ง</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {canManageDefaultRole && changedCount > 0 && (
            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-[#c8c5d0] bg-white/95 backdrop-blur">
              <span className="text-[13px] leading-[20px] text-[#47464f] whitespace-nowrap">เปลี่ยนแปลง {changedCount} รายการ</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-9 rounded-lg px-3 text-[12px] tracking-[0.05em] uppercase"
                  onClick={() => setDraft({})}
                  disabled={saving}
                >
                  รีเซ็ต
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-9 px-3 text-[12px] tracking-[0.05em] uppercase flex items-center gap-2 shadow-sm"
                >
                  <Save className="w-[15px] h-[15px]" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
              </div>
            </div>
          )}
        </div>

        </>
  );
}
