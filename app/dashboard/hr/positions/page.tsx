"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import type { PositionListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  CountPill,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

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

  const columns: MasterDataColumn<PositionListItem>[] = [
    {
      key: "name",
      header: "ชื่อตำแหน่ง",
      className: "font-semibold",
      cell: (pos) => pos.positionName,
    },
    {
      key: "defaultRole",
      header: "บทบาทเริ่มต้น",
      cell: (pos) => {
        const isDirty = Object.prototype.hasOwnProperty.call(draft, pos.positionId);
        const stagedRoleId = isDirty ? draft[pos.positionId] : pos.defaultRoleId;
        const selectValue = stagedRoleId && activeRoles.some((r) => r.role_id === stagedRoleId) ? stagedRoleId : "none";

        if (canManageDefaultRole) {
          return (
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
          );
        }

        if (pos.defaultRoleName) {
          return <CountPill>{pos.defaultRoleName}</CountPill>;
        }

        return <span className="text-[#a3a0ad]">—</span>;
      },
    },
    {
      key: "level",
      align: "center",
      header: (
        <button
          type="button"
          className="flex items-center justify-center gap-1 w-full cursor-pointer select-none"
          onClick={() =>
            setLevelSortDir(levelSortDir === "asc" ? "desc" : levelSortDir === "desc" ? null : "asc")
          }
        >
          ระดับตำแหน่ง
          {levelSortDir === "asc" ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : levelSortDir === "desc" ? (
            <ArrowDown className="w-3.5 h-3.5" />
          ) : (
            <ArrowUpDown className="w-3.5 h-3.5" />
          )}
        </button>
      ),
      cell: (pos) => pos.positionLevel ?? "-",
    },
    {
      key: "staff",
      header: "จำนวนพนักงาน",
      align: "center",
      cell: (pos) => <CountPill>{pos.staffCount}</CountPill>,
    },
    { key: "status", header: "สถานะ", cell: (pos) => <ActiveStatusBadge isActive={pos.isActive} /> },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการตำแหน่ง" }]}
      title="จัดการตำแหน่ง"
      subtitle="Manage organizational positions and hierarchies."
      searchPlaceholder="ค้นหาชื่อตำแหน่ง..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Position"
      onAdd={() => router.push("/dashboard/hr/positions/add")}
      data={sorted}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลตำแหน่ง"
      countText={(count) => `Showing ${count} positions`}
      columns={columns}
      rowKey={(pos) => pos.positionId}
      renderActions={(pos) => (
        <EntityRowActions
          isActive={pos.isActive}
          toggling={togglingIds.includes(pos.positionId)}
          onEdit={() => router.push(`/dashboard/hr/positions/edit?positionId=${pos.positionId}`)}
          onToggle={() => handleToggleActive(pos.positionId, pos.isActive)}
        />
      )}
      footer={
        canManageDefaultRole && changedCount > 0 ? (
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
        ) : null
      }
    />
  );
}
