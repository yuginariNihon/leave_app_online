"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { LeaveCaseListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  CountPill,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

export default function LeaveCasesPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<LeaveCaseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

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
        const json = await apiFetch<{ data: LeaveCaseListItem[] }>("/api/hr/leave-cases");
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลกรณีการลาได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (c) =>
      c.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/leave-cases/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((c) => (c.leaveCaseId === id ? { ...c, isActive: !currentActive } : c)),
      );
      toast.success(!currentActive ? "เปิดใช้งานกรณีการลาเรียบร้อย" : "ปิดใช้งานกรณีการลาเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const columns: MasterDataColumn<LeaveCaseListItem>[] = [
    {
      key: "caseName",
      header: "ชื่อกรณี",
      className: "font-semibold",
      cell: (c) => c.caseName,
    },
    {
      key: "leaveType",
      header: "ประเภทการลา",
      cell: (c) => <CountPill>{c.leaveTypeName}</CountPill>,
    },
    {
      key: "leaves",
      header: "จำนวนใบลา",
      align: "center",
      cell: (c) => <CountPill>{c.leaveCount}</CountPill>,
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (c) => <ActiveStatusBadge isActive={c.isActive} />,
    },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการกรณีการลา" }]}
      title="จัดการกรณีการลา"
      subtitle="Manage leave cases and their associated leave types."
      searchPlaceholder="ค้นหาชื่อกรณี..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Leave Case"
      onAdd={() => router.push("/dashboard/hr/leave-cases/add")}
      data={filtered}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลกรณีการลา"
      countText={(count) => `Showing ${count} leave cases`}
      columns={columns}
      rowKey={(c) => c.leaveCaseId}
      renderActions={(c) => (
        <EntityRowActions
          isActive={c.isActive}
          toggling={togglingIds.includes(c.leaveCaseId)}
          onEdit={() => router.push(`/dashboard/hr/leave-cases/edit?leaveCaseId=${c.leaveCaseId}`)}
          onToggle={() => handleToggleActive(c.leaveCaseId, c.isActive)}
        />
      )}
    />
  );
}
