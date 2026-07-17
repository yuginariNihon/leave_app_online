"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { createSectionSchema, updateSectionSchema } from "@/lib/TypeSchema";
import type { CreateSectionValues, UpdateSectionValues } from "@/lib/TypeSchema";

interface SectionFormProps {
  mode: "create" | "edit";
  defaultValues?: { sectionCode: string; sectionName: string; departmentId: string };
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string;
  onSubmit: (values: CreateSectionValues | UpdateSectionValues) => void;
  onCancel: () => void;
}

type DepartmentOption = {
  departmentId: string;
  departmentName: string;
};

export function SectionForm({
  mode,
  defaultValues,
  isSubmitting,
  isSuccess,
  submitError,
  onSubmit,
  onCancel,
}: SectionFormProps) {
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const res = await fetch("/api/hr/departments");
        if (res.ok) {
          const json = await res.json();
          setDepartments(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoadingDepts(false);
      }
    }
    fetchDepts();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSectionValues | UpdateSectionValues>({
    resolver: zodResolver(mode === "create" ? createSectionSchema : updateSectionSchema),
    defaultValues: defaultValues ?? { sectionCode: "", sectionName: "", departmentId: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            รหัสส่วนงาน
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <input
            {...register("sectionCode")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] uppercase"
            placeholder="รหัสส่วนงาน"
            onChange={(e) => {
              const target = e.target;
              target.value = target.value.toUpperCase();
              register("sectionCode").onChange(e);
            }}
          />
          {errors.sectionCode && (
            <p className="text-sm text-red-500">{errors.sectionCode.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            ชื่อส่วนงาน
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <input
            {...register("sectionName")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ชื่อส่วนงาน"
          />
          {errors.sectionName && (
            <p className="text-sm text-red-500">{errors.sectionName.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            แผนก
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <select
            {...register("departmentId")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
          >
            <option value="">
              {loadingDepts ? "กำลังโหลดแผนก..." : "--- เลือกแผนก ---"}
            </option>
            {departments.map((dept) => (
              <option key={dept.departmentId} value={dept.departmentId}>
                {dept.departmentName}
              </option>
            ))}
          </select>
          {errors.departmentId && (
            <p className="text-sm text-red-500">{errors.departmentId.message}</p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {submitError}
        </div>
      )}

      <div className="flex flex-row w-full justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          className="text-[#45464d] hover:text-[#0F172A] font-semibold rounded-xl h-11 min-w-[140px] border border-slate-300"
          onClick={onCancel}
        >
          ยกเลิก
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isSuccess}
          className="bg-[#1a1a40] hover:bg-[#2a2a5a] text-white font-semibold rounded-xl h-11 min-w-[140px]"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSubmitting ? "กำลังบันทึก..." : isSuccess ? "บันทึกสำเร็จ" : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
