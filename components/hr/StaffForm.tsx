"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, Mail, Check, Save, Loader2, BadgeInfo, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateStaffSchema, createStaffSchema, type UpdateStaffValues, type CreateStaffValues } from "@/lib/TypeSchema";
import type { StaffMasterData } from "@/lib/services/leaveService";
import { HelpSection } from "@/components/hr/HelpSection";

const statusOptions = [
  { value: "active" as const, label: "Active" },
  { value: "inactive" as const, label: "Inactive" },
  { value: "terminated" as const, label: "Terminated" },
];

type Mode = "create" | "edit";

type SharedProps = {
  mode: Mode;
  masterData: StaffMasterData | null;
  onSubmit: (values: UpdateStaffValues | CreateStaffValues) => Promise<void>;
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string;
  onCancel: () => void;
  defaultValues?: Partial<CreateStaffValues>;
  staffCode?: string;
};

export function StaffForm({
  mode,
  masterData,
  onSubmit,
  isSubmitting,
  isSuccess,
  submitError,
  onCancel,
  onBack,
  defaultValues,
  staffCode,
}: SharedProps & { onBack?: () => void }) {
  const schema = mode === "create" ? createStaffSchema : updateStaffSchema;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;
  const selectedDept = watch("departmentId");
  const selectedStatus = watch("employmentStatus");

  const filteredSections = masterData?.sections.filter(
    (s) => s.departmentId === selectedDept,
  ) ?? [];

  const errs = errors as Record<string, { message?: string }>;

  return (
    <div
      className="bg-white rounded-2xl border border-[#c6c6cd]/30 overflow-hidden"
      style={{ boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)" }}
    >
      <div className="bg-[#0F172A] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-row gap-3 items-center justify-center">
          <div className="flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center backdrop-blur-md">
            <User className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-[28px] md:text-[32px] font-semibold text-white leading-9 md:leading-10 tracking-[-0.01em] mb-1">
              {mode === "create" ? "เพิ่มรายชื่อพนักงาน" : "แก้ไขข้อมูลพนักงาน"}
            </h2>
            {staffCode && (
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1 rounded-full">
                <BadgeInfo className="w-3.5 h-3.5 text-[#dae2fd]" />
                <span className="text-sm font-semibold text-[#dae2fd] tracking-wide">
                  รหัสพนักงาน: {staffCode}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-white hover:text-[#100d41]"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" />
              ย้อนกลับ
            </Button>
          )}
          
        </div>
      </div>

      <form className="p-8 space-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
          {mode === "create" && (
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
                รหัสพนักงาน
                <span className="text-[#ba1a1a] text-xs">*</span>
              </label>
              <input
                {...register("staffCode")}
                className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] uppercase"
                placeholder="รหัสพนักงาน"
                onChange={(e) => {
                  const target = e.target;
                  target.value = target.value.toUpperCase();
                  register("staffCode").onChange(e);
                }}
              />
              {errs.staffCode && (
                <p className="text-sm text-red-500">{errs.staffCode?.message}</p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              อีเมล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d]" />
              <input
                {...register("email")}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                placeholder="อีเมล"
                type="email"
                required
              />
              {errs.email && (
                <p className="text-red-500 text-sm mt-1">{errs.email.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
              ชื่อ-นามสกุล
              <span className="text-[#ba1a1a] text-xs">*</span>
            </label>
            <input
              {...register("name")}
              className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              placeholder="ชื่อ-นามสกุล"
            />
            {errs.name && (
              <p className="text-sm text-red-500">{errs.name?.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              แผนก
            </label>
            <Select
              value={selectedDept}
              onValueChange={(v) => {
                setValue("departmentId", v, { shouldValidate: true });
                setValue("sectionId", "");
              }}
            >
              <SelectTrigger className="w-full !h-11 rounded-xl border-[#c6c6cd] text-base">
                <SelectValue placeholder="เลือกแผนก" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" avoidCollisions={false} sideOffset={4}>
                {masterData?.departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errs.departmentId && (
              <p className="text-sm text-red-500">{errs.departmentId?.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              ตำแหน่ง
            </label>
            <Select
              value={watch("positionId")}
              onValueChange={(v) => setValue("positionId", v, { shouldValidate: true })}
            >
              <SelectTrigger className="w-full !h-11 rounded-xl border-[#c6c6cd] text-base">
                <SelectValue placeholder="เลือกตำแหน่ง" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" avoidCollisions={false} sideOffset={4}>
                {masterData?.positions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errs.positionId && (
              <p className="text-sm text-red-500">{errs.positionId?.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              ส่วนงาน (SECTION)
            </label>
            <Select
              value={watch("sectionId") ?? ""}
              onValueChange={(v) => setValue("sectionId", v || null)}
              disabled={filteredSections.length === 0}
            >
              <SelectTrigger className="w-full !h-11 rounded-xl border-[#c6c6cd] text-base">
                <SelectValue placeholder="เลือกส่วนงาน" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" avoidCollisions={false} sideOffset={4}>
                {filteredSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              ประเภทพนักงาน
            </label>
            <Select
              value={watch("employmentTypeId") ?? ""}
              onValueChange={(v) => setValue("employmentTypeId", v || null)}
            >
              <SelectTrigger className="w-full !h-11 rounded-xl border-[#c6c6cd] text-base">
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" avoidCollisions={false} sideOffset={4}>
                {masterData?.employmentTypes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.thainame || e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d]" />
              <input
                {...register("phoneNumber")}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
                placeholder="เบอร์โทรศัพท์"
                required
              />
              {errs.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errs.phoneNumber.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              วันเกิด
            </label>
            <div className="relative">
              {/*<Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d] pointer-events-none" />*/}
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              วันที่เริ่มงาน
            </label>
            <div className="relative">
              {/*<Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d] pointer-events-none" />*/}
              <input
                type="date"
                {...register("startDate")}
                className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-semibold text-[#45464d] tracking-wide">
              สถานะพนักงาน
            </label>
            <div className="flex flex-wrap gap-4">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <label
                    key={opt.value}
                    className={`flex-1 min-w-[140px] flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#0F172A] bg-[#0F172A]/5"
                        : "border-[#c6c6cd] bg-white hover:border-[#76777d]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          isSelected
                            ? "border-4 border-[#0F172A] bg-white"
                            : "border border-[#c6c6cd] bg-white"
                        }`}
                      />
                      <span
                        className={`text-base ${
                          isSelected ? "font-semibold text-[#0F172A]" : "text-[#45464d]"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-[#0F172A]" />
                    )}
                    <input
                      type="radio"
                      className="hidden"
                      checked={isSelected}
                      onChange={() =>
                        setValue("employmentStatus", opt.value, { shouldValidate: true })
                      }
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
            {submitError}
          </div>
        )}

        <div className="pt-8 border-t border-[#c6c6cd] flex flex-col sm:flex-row justify-end items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto h-11 min-w-[140px] text-sm font-semibold text-[#45464d] hover:bg-[#e6e8ea] rounded-xl border border-slate-300"
            onClick={onCancel}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isSuccess}
            className={`w-full sm:w-auto h-11 min-w-[140px] text-sm font-semibold rounded-xl shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
              isSuccess
                ? "bg-green-600 hover:bg-green-600 text-white"
                : "bg-[#0F172A] hover:bg-[#1E293B] text-white"
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4" />
                {mode === "create" ? "บันทึกสำเร็จ" : "แก้ไขเรียบร้อย"}
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </form>

      <HelpSection mode={mode} entityName="ข้อมูลพนักงาน" />
    </div>
  );
}
