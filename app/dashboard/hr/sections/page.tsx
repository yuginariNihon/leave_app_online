"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCsvExport } from "@/hooks/useCsvExport";
import { apiFetch } from "@/lib/api";
import type { SectionListItem } from "@/lib/services/leaveService";
import { toast } from "sonner";
import {
  ActiveStatusBadge,
  EntityRowActions,
  MasterDataListPage,
  type MasterDataColumn,
} from "@/components/shared/MasterDataListPage";

export default function SectionsPage() {
  const router = useRouter();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<SectionListItem[]>([]);
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
        const json = await apiFetch<{ data: SectionListItem[] }>("/api/hr/sections");
        if (!cancelled) setData(json.data);
      } catch {
        if (!cancelled) setError("ไม่สามารถโหลดข้อมูลส่วนงานได้");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [fetchKey]);

  const filtered = data.filter(
    (s) =>
      s.sectionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.sectionCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setTogglingIds((prev) => [...prev, id]);
    try {
      await apiFetch(`/api/hr/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !currentActive }),
      });
      setData((prev) =>
        prev.map((s) => (s.sectionId === id ? { ...s, isActive: !currentActive } : s)),
      );
      toast.success(!currentActive ? "เปิดใช้งานส่วนงานเรียบร้อย" : "ปิดใช้งานส่วนงานเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setTogglingIds((prev) => prev.filter((tid) => tid !== id));
    }
  };

  const exportCsv = useCsvExport<SectionListItem>({
    filename: "sections",
    columns: ["รหัสส่วนงาน", "ชื่อส่วนงาน", "แผนก", "สถานะ"],
    toRow: (s) => [s.sectionCode, s.sectionName, s.departmentName, s.isActive ? "Active" : "Inactive"],
  });

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลให้ส่งออก");
      return;
    }
    exportCsv(filtered);
    toast.success(`ส่งออกข้อมูลส่วนงาน ${filtered.length} รายการเรียบร้อย`);
  };

  const columns: MasterDataColumn<SectionListItem>[] = [
    {
      key: "code",
      header: "รหัสส่วนงาน",
      className: "font-semibold text-[#070235]",
      cell: (s) => s.sectionCode,
    },
    { key: "name", header: "ชื่อส่วนงาน", cell: (s) => s.sectionName },
    { key: "department", header: "แผนก", cell: (s) => s.departmentName },
    { key: "status", header: "สถานะ", cell: (s) => <ActiveStatusBadge isActive={s.isActive} /> },
  ];

  return (
    <MasterDataListPage
      breadcrumb={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการส่วนงาน" }]}
      title="จัดการส่วนงาน"
      subtitle="Manage sections and sub-department units."
      searchPlaceholder="ค้นหาชื่อส่วนงาน..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      addLabel="Add Section"
      onAdd={() => router.push("/dashboard/hr/sections/add")}
      onExport={handleExport}
      data={filtered}
      loading={loading}
      error={error}
      emptyMessage="ไม่พบข้อมูลส่วนงาน"
      countText={(count) => `Showing ${count} sections`}
      columns={columns}
      rowKey={(s) => s.sectionId}
      renderActions={(s) => (
        <EntityRowActions
          isActive={s.isActive}
          toggling={togglingIds.includes(s.sectionId)}
          onEdit={() => router.push(`/dashboard/hr/sections/edit/${s.sectionId}`)}
          onToggle={() => handleToggleActive(s.sectionId, s.isActive)}
        />
      )}
    />
  );
}
