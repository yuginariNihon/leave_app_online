"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Shield, Save, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarMenu } from "@/components/sidebar-menu/SidebarMenu";
import DashboardContent from "@/components/DashboardContent";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { toast } from "sonner";
import { useUser } from "@/lib/user-context";

type PagePermission = {
  pageResourceId: string;
  pageKey: string;
  pageName: string;
  groupName: string;
  allowedRoleIds: string[];
  allowedRoleNames: string[];
};

type RoleOption = {
  roleId: string;
  roleName: string;
};

export default function PagePermissionsPage() {
  const router = useRouter();
  const { roles: userRoles } = useUser();
  const [fetchKey, setFetchKey] = useState(0);

  const [data, setData] = useState<PagePermission[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingGroups, setSavingGroups] = useState<Record<string, boolean>>({});

  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  useEffect(() => {
    if (!isSuperAdmin) router.replace("/dashboard");
  }, [isSuperAdmin, router]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setFetchKey((k) => k + 1);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [permRes, rolesRes] = await Promise.all([
        fetch("/api/admin/page-permissions"),
        fetch("/api/hr/roles"),
      ]);
      if (!permRes.ok || !rolesRes.ok) throw new Error("Failed to load data");
      const permJson = await permRes.json();
      const rolesJson = await rolesRes.json();

      const sorted = permJson.data.sort(
        (a: PagePermission, b: PagePermission) =>
          a.groupName.localeCompare(b.groupName) || a.pageName.localeCompare(b.pageName),
      );
      setData(sorted);
      setRoleOptions(rolesJson.data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData, fetchKey]);

  const toggleRole = (pageResourceId: string, roleId: string) => {
    setData((prev) =>
      prev.map((p) =>
        p.pageResourceId === pageResourceId
          ? {
              ...p,
              allowedRoleIds: p.allowedRoleIds.includes(roleId)
                ? p.allowedRoleIds.filter((id) => id !== roleId)
                : [...p.allowedRoleIds, roleId],
            }
          : p,
      ),
    );
  };

  const handleSaveGroup = async (groupName: string) => {
    setSavingGroups((prev) => ({ ...prev, [groupName]: true }));
    try {
      const groupPages = data.filter((p) => p.groupName === groupName);
      const permissions = groupPages.map((p) => ({
        pageResourceId: p.pageResourceId,
        roleIds: p.allowedRoleIds,
      }));

      const res = await fetch("/api/admin/page-permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success(`บันทึกกลุ่ม "${groupName}" เรียบร้อย`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSavingGroups((prev) => ({ ...prev, [groupName]: false }));
    }
  };

  if (!isSuperAdmin) return null;

  const grouped = data.reduce<Record<string, PagePermission[]>>((acc, p) => {
    if (!acc[p.groupName]) acc[p.groupName] = [];
    acc[p.groupName].push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SidebarMenu />
      <DashboardContent>
        <AppBreadcrumb
          items={[
            { label: "Home", href: "/dashboard" },
            { label: "Admin" },
            { label: "จัดการสิทธิ์การเข้าถึงหน้า" },
          ]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการสิทธิ์การเข้าถึงหน้า</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">กำหนดว่า Role ไหนสามารถเข้าถึงหน้าใดได้บ้าง (SUPER_ADMIN เข้าถึงได้ทุกหน้าโดยอัตโนมัติ)</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20 text-[#47464f]">กำลังโหลด...</div>
        ) : error ? (
          <div className="flex justify-center items-center py-20 text-red-500">{error}</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([groupName, pages]) => (
              <div key={groupName} className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-[#c8c5d0] bg-slate-50/50 flex items-center justify-between">
                  <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">{groupName}</h4>
                  <Button
                    onClick={() => handleSaveGroup(groupName)}
                    disabled={savingGroups[groupName] || loading}
                    size="sm"
                    className="bg-[#6063ee] hover:bg-secondary text-white font-semibold rounded-lg h-8 px-3 text-[11px] tracking-[0.05em] uppercase flex items-center gap-1.5 shadow-sm"
                  >
                    {savingGroups[groupName] ? (
                      <Loader2 className="w-[14px] h-[14px] animate-spin" />
                    ) : (
                      <Save className="w-[14px] h-[14px]" />
                    )}
                    {savingGroups[groupName] ? "กำลังบันทึก..." : "บันทึก"}
                  </Button>
                </div>
                <div className="divide-y divide-[#c8c5d0]">
                  {pages.map((page) => (
                    <div key={page.pageResourceId} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] leading-[20px] font-semibold text-[#070235]">{page.pageName}</p>
                        <p className="text-[12px] leading-[16px] text-[#787680] font-mono">{page.pageKey}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roleOptions.map((role) => {
                          const isChecked = page.allowedRoleIds.includes(role.roleId);
                          const isSuperAdminRole = role.roleName === "SUPER_ADMIN";

                          return (
                            <Button
                              key={role.roleId}
                              type="button"
                              disabled={isSuperAdminRole}
                              onClick={() => toggleRole(page.pageResourceId, role.roleId)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border transition-all active:scale-95 ${
                                isChecked
                                  ? "bg-[#1a1a40] text-white border-[#1a1a40]"
                                  : "bg-white text-[#47464f] border-[#c8c5d0] hover:border-[#1a1a40]/30"
                              } ${isSuperAdminRole ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {isSuperAdminRole && <Shield className="w-3 h-3" />}
                              {role.roleName}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-20 text-[#47464f]">
                <FileText className="w-10 h-10 opacity-20" />
                <span>ไม่พบข้อมูล</span>
              </div>
            )}
          </div>
        )}
      </DashboardContent>
    </div>
  );
}
