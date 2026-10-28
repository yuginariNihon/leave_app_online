"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { LeaveTypeListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  CountPill,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

export default function LeaveTypesPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<LeaveTypeListItem[]>([]);
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
        const json = await apiFetch<{ data: LeaveTypeListItem[] }>("/api/hr/leave-types");
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลประเภทการลาได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (lt) =>
      lt.leaveTypeName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/leave-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((lt) => (lt.leaveTypeId === id ? { ...lt, isActive: !currentActive } : lt)),
      );
      toast.success(!currentActive ? "เปิดใช้งานประเภทการลาเรียบร้อย" : "ปิดใช้งานประเภทการลาเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const columns: MasterDataColumn<LeaveTypeListItem>[] = [
    {
      key: "name",
      header: "ชื่อประเภท",
      className: "font-semibold",
      cell: (lt) => lt.leaveTypeName,
    },
    {
      key: "maxDays",
      header: "จำนวนวันสูงสุด/ปี",
      align: "center",
      cell: (lt) => lt.maxDaysPerYear ?? "ไม่จำกัด",
    },
    {
      key: "paid",
      header: "ได้เงิน",
      align: "center",
      cell: (lt) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${lt.isPaid ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-black border-gray-300"}`}>
          {lt.isPaid ? "ได้เงิน" : "ไม่ได้เงิน"}
        </span>
      ),
    },
    {
      key: "attachment",
      header: "ต้องแนบเอกสาร",
      align: "center",
      cell: (lt) => (
        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${lt.requiresAttachment ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-100 text-black border-gray-300"}`}>
          {lt.requiresAttachment ? "ต้องแนบ" : "ไม่ต้องแนบ"}
        </span>
      ),
    },
    {
      key: "cases",
      header: "จำนวนกรณี",
      align: "center",
      cell: (lt) => <CountPill>{lt.leaveCaseCount}</CountPill>,
    },
    {
      key: "leaves",
      header: "จำนวนใบลา",
      align: "center",
      cell: (lt) => <CountPill>{lt.leaveCount}</CountPill>,
    },
    {
      key: "status",
      header: "สถานะ",
      cell: (lt) => <ActiveStatusBadge isActive={lt.isActive} />,
    },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการประเภทการลา" }]}
      title="จัดการประเภทการลา"
      subtitle="Manage leave types and organizational policies."
      searchPlaceholder="ค้นหาชื่อประเภท..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Leave Type"
      onAdd={() => router.push("/dashboard/hr/leave-types/add")}
      data={filtered}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลประเภทการลา"
      countText={(count) => `Showing ${count} leave types`}
      columns={columns}
      rowKey={(lt) => lt.leaveTypeId}
      renderActions={(lt) => (
        <EntityRowActions
          isActive={lt.isActive}
          toggling={togglingIds.includes(lt.leaveTypeId)}
          onEdit={() => router.push(`/dashboard/hr/leave-types/edit?leaveTypeId=${lt.leaveTypeId}`)}
          onToggle={() => handleToggleActive(lt.leaveTypeId, lt.isActive)}
        />
      )}
    />
  );
}
