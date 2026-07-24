"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Pencil, FileText, UserCog } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { toast } from "sonner";
import { StaffRoleDialog } from "@/app/dashboard/admin/roles/StaffRoleDialog";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";

type StaffWithRoles = {
  staffId: string;
  staffCode: string;
  name: string;
  departmentName: string | null;
  roles: string[];
};

type RoleOption = {
  roleId: string;
  roleName: string;
};

export default function StaffRolesPage() {
  const router = useRouter();
  const { roles: userRoles } = useUser();
  const [fetchKey, setFetchKey] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<StaffWithRoles[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffWithRoles | null>(null);

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
      const [staffRes, rolesRes] = await Promise.all([
        fetch("/api/hr/roles/staff-list"),
        fetch("/api/hr/roles"),
      ]);
      if (!staffRes.ok || !rolesRes.ok) throw new Error("Failed to load data");
      const staffJson = await staffRes.json();
      const rolesJson = await rolesRes.json();
      setData(staffJson.data);
      setRoleOptions(rolesJson.data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, fetchKey]);

  const filtered = data.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffCode.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (staff: StaffWithRoles) => {
    setSelectedStaff(staff);
    setDialogOpen(true);
  };

  const handleSave = async (staffId: string, roleNames: string[]) => {
    try {
      const res = await fetch(`/api/hr/roles/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: roleNames }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update roles");
      }
      setData((prev) =>
        prev.map((s) => (s.staffId === staffId ? { ...s, roles: roleNames } : s)),
      );
      toast.success("อัปเดตบทบาทเรียบร้อย");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
        <>

        <AppBreadcrumb
          items={[{ label: "Home", href: "/dashboard" }, { label: "HR" }, { label: "จัดการสิทธิ์ของพนักงาน" }]}
          className="mb-4"
        />

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-6">
          <div>
            <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.02em] text-[#070235]">จัดการสิทธิ์ของพนักงาน</h1>
            <p className="text-[14px] leading-[20px] text-[#47464f]">กำหนดบทบาทให้พนักงานแต่ละคน (SUPER_ADMIN เท่านั้น)</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#787680] w-[20px] h-[20px]" />
            <Input
              className="pl-10 h-11 border-[#c8c5d0] focus-visible:ring-secondary/20 rounded-lg text-[14px] w-[200px]"
              placeholder="ค้นหาชื่อหรือรหัส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#c8c5d0] shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#c8c5d0] flex items-center justify-between bg-slate-50/50">
            <h4 className="text-[12px] leading-[16px] tracking-[0.05em] font-semibold uppercase text-[#47464f]">
              <UserCog className="w-4 h-4 inline-block -mt-0.5 mr-1.5" />
              Staff Roles
            </h4>
            <span className="text-[13px] leading-[18px] text-[#47464f] italic">Showing {filtered.length} staff</span>
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
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">รหัส</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">ชื่อ</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">แผนก</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase">บทบาท</TableHead>
                    <TableHead className="text-white font-semibold px-6 py-4 text-[13px] leading-[16px] tracking-[0.02em] uppercase text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-[#c8c5d0]">
                  {filtered.length > 0 ? (
                    filtered.map((s) => (
                      <TableRow key={s.staffId} className="hover:bg-[#eff4ff]/30 transition-all duration-200">
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap">{s.staffCode}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] font-semibold whitespace-nowrap">{s.name}</TableCell>
                        <TableCell className="px-6 py-4 text-[14px] leading-[20px] whitespace-nowrap text-[#47464f]">{s.departmentName ?? "-"}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {s.roles.length > 0 ? (
                              s.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-3 py-0.5 rounded-full text-[11px] leading-[16px] font-semibold tracking-[0.05em] whitespace-nowrap border ${
                                    role === "SUPER_ADMIN"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : role === "HR"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : role === "APPROVER"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-[#787680] text-[13px]">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <Button
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#787680] hover:text-[#4648d4] hover:bg-[#4648d4]/10 transition-all"
                              onClick={() => handleEdit(s)}
                            >
                              <Pencil className="w-[20px] h-[20px]" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-[#47464f]">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-10 h-10 opacity-20" />
                          <span>ไม่พบข้อมูลพนักงาน</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>


      {selectedStaff && (
        <StaffRoleDialog
          open={dialogOpen}
          onOpenChange={(open) => { setDialogOpen(open); if (!open) setSelectedStaff(null); }}
          staff={selectedStaff}
          roleOptions={roleOptions}
          onSave={handleSave}
        />
      )}
        </>
  );
}