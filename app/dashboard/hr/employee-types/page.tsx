"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { EmploymentTypeListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  CountPill,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

export default function EmployeeTypesPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<EmploymentTypeListItem[]>([]);
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
        const json = await apiFetch<{ data: EmploymentTypeListItem[] }>("/api/hr/employee-types");
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลประเภทพนักงานได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (et) =>
      et.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (et.thainame?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      et.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/employee-types/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((et) => (et.employmentTypeId === id ? { ...et, isActive: !currentActive } : et)),
      );
      toast.success(!currentActive ? "เปิดใช้งานประเภทพนักงานเรียบร้อย" : "ปิดใช้งานประเภทพนักงานเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const columns: MasterDataColumn<EmploymentTypeListItem>[] = [
    {
      key: "code",
      header: "รหัส",
      className: "font-semibold text-[#070235]",
      cell: (et) => et.code,
    },
    { key: "name", header: "ชื่อ (Name EN)", className: "font-medium", cell: (et) => et.name },
    { key: "thainame", header: "ชื่อภาษาไทย (Name TH)", cell: (et) => et.thainame ?? "-" },
    {
      key: "staff",
      header: "จำนวนพนักงาน",
      align: "center",
      cell: (et) => <CountPill>{et.staffCount}</CountPill>,
    },
    { key: "status", header: "สถานะ", cell: (et) => <ActiveStatusBadge isActive={et.isActive} /> },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการประเภทพนักงาน" }]}
      title="จัดการประเภทพนักงาน"
      subtitle="Manage organizational classifications and employment categories."
      searchPlaceholder="ค้นหาชื่อหรือรหัส..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Employee Type"
      onAdd={() => router.push("/dashboard/hr/employee-types/add")}
      data={filtered}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลประเภทพนักงาน"
      countText={(count) => `Showing ${count} categories`}
      columns={columns}
      rowKey={(et) => et.employmentTypeId}
      renderActions={(et) => (
        <EntityRowActions
          isActive={et.isActive}
          toggling={togglingIds.includes(et.employmentTypeId)}
          onEdit={() => router.push(`/dashboard/hr/employee-types/edit?employeeTypeId=${et.employmentTypeId}`)}
          onToggle={() => handleToggleActive(et.employmentTypeId, et.isActive)}
        />
      )}
    />
  );
}
