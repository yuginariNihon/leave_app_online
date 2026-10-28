"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { downloadCsv, csvCell } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import type { DepartmentListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  CountPill,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

export default function DepartmentsPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<DepartmentListItem[]>([]);
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
        const json = await apiFetch<{ data: DepartmentListItem[] }>("/api/hr/departments");
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลแผนกได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (d) =>
      d.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.departmentCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/departments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((d) => (d.departmentId === id ? { ...d, isActive: !currentActive } : d)),
      );
      toast.success(!currentActive ? "เปิดใช้งานแผนกเรียบร้อย" : "ปิดใช้งานแผนกเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }
    const rows = filtered.map((d) => [
      csvCell(d.departmentCode),
      csvCell(d.departmentName),
      csvCell(d.sectionCount),
      csvCell(d.staffCount),
      csvCell(d.isActive ? "Active" : "Inactive"),
    ]);
    const csvContent = [
      ["รหัสแผนก", "ชื่อแผนก", "จำนวนส่วนงาน", "จำนวนพนักงาน", "สถานะ"],
      ...rows,
    ]
      .map((r) => r.join(","))
      .join("\n");
    downloadCsv(`departments_${new Date().toISOString().split("T")[0]}.csv`, `\uFEFF${csvContent}`);
    toast.success(`ส่งออกข้อมูลแผนก ${filtered.length} รายการเรียบร้อย`);
  };

  const columns: MasterDataColumn<DepartmentListItem>[] = [
    {
      key: "code",
      header: "รหัสแผนก",
      className: "font-semibold text-[#070235]",
      cell: (d) => d.departmentCode,
    },
    { key: "name", header: "ชื่อแผนก", cell: (d) => d.departmentName },
    {
      key: "sections",
      header: "จำนวนส่วนงาน",
      align: "center",
      cell: (d) => <CountPill>{d.sectionCount}</CountPill>,
    },
    {
      key: "staff",
      header: "จำนวนพนักงาน",
      align: "center",
      cell: (d) => <CountPill>{d.staffCount}</CountPill>,
    },
    { key: "status", header: "สถานะ", cell: (d) => <ActiveStatusBadge isActive={d.isActive} /> },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการแผนก" }]}
      title="จัดการแผนก"
      subtitle="Manage departments and organizational units."
      searchPlaceholder="ค้นหาชื่อแผนก..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Department"
      onAdd={() => router.push("/dashboard/hr/departments/add")}
      onExport={handleExport}
      data={filtered}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลแผนก"
      countText={(count) => `Showing ${count} departments`}
      columns={columns}
      rowKey={(d) => d.departmentId}
      renderActions={(d) => (
        <EntityRowActions
          isActive={d.isActive}
          toggling={togglingIds.includes(d.departmentId)}
          onEdit={() => router.push(`/dashboard/hr/departments/edit?departmentId=${d.departmentId}`)}
          onToggle={() => handleToggleActive(d.departmentId, d.isActive)}
        />
      )}
    />
  );
}
