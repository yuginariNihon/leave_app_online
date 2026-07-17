"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Shield } from "lucide-react";

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: StaffWithRoles;
  roleOptions: RoleOption[];
  onSave: (staffId: string, roleNames: string[]) => Promise<void>;
};

export function StaffRoleDialog({ open, onOpenChange, staff, roleOptions, onSave }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected([...staff.roles]);
    }
  }, [open, staff]);

  const toggleRole = (roleName: string) => {
    setSelected((prev) =>
      prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(staff.staffId, selected);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#1a1a40]" />
            จัดการบทบาท: {staff.name}
          </DialogTitle>
          <DialogDescription>
            รหัส {staff.staffCode} — {staff.departmentName ?? "ไม่มีแผนก"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {roleOptions.map((role) => {
            const isChecked = selected.includes(role.roleName);

            return (
              <label
                key={role.roleId}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isChecked
                    ? "bg-[#1a1a40]/5 border-[#1a1a40]/20"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={false}
                  onChange={() => toggleRole(role.roleName)}
                  className="w-4 h-4 accent-[#1a1a40]"
                />
                <div className="flex-1">
                  <span className="text-sm font-semibold text-[#1a1a40]">{role.roleName}</span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {role.roleName === "SUPER_ADMIN"
                      ? "สิทธิ์สูงสุด — เข้าถึงได้ทุกฟังก์ชัน"
                      : role.roleName === "HR"
                      ? "สิทธิ์ทรัพยากรบุคคล — จัดการข้อมูลพนักงานและคำขอลา"
                      : role.roleName === "APPROVER"
                      ? "สิทธิ์ผู้อนุมัติ — อนุมัติคำขอลาของผู้ใต้บังคับบัญชา"
                      : role.roleName === "STAFF"
                      ? "สิทธิ์พนักงานทั่วไป — ขอลาและดูประวัติ"
                      : ""}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-[#45464d] hover:text-[#0F172A] font-semibold rounded-xl h-11 min-w-[100px] border border-slate-300 transition-all active:scale-95"
            onClick={() => onOpenChange(false)}
          >
            ยกเลิก
          </Button>
          <Button
            type="button"
            disabled={saving}
            className="bg-[#1a1a40] hover:bg-[#2a2a5a] text-white font-semibold rounded-xl h-11 min-w-[100px] transition-all active:scale-95"
            onClick={handleSave}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
