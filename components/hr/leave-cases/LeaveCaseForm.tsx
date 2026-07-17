"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { createLeaveCaseSchema } from "@/lib/TypeSchema";
import type { CreateLeaveCaseValues, UpdateLeaveCaseValues } from "@/lib/TypeSchema";

interface LeaveCaseFormProps {
  mode: "create" | "edit";
  defaultValues?: { leaveTypeId: string; caseName: string };
  leaveTypeOptions: { id: string; label: string }[];
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string;
  onSubmit: (values: CreateLeaveCaseValues | UpdateLeaveCaseValues) => void;
  onCancel: () => void;
}

export function LeaveCaseForm({

  defaultValues,
  leaveTypeOptions,
  isSubmitting,
  isSuccess,
  submitError,
  onSubmit,
  onCancel,
}: LeaveCaseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors: errs },
  } = useForm<CreateLeaveCaseValues>({
    resolver: zodResolver(createLeaveCaseSchema),
    defaultValues: defaultValues ?? { leaveTypeId: "", caseName: "" },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            ประเภทการลา
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <select
            {...register("leaveTypeId")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
          >
            <option value="">-- เลือกประเภทการลา --</option>
            {leaveTypeOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          {errs.leaveTypeId && (
            <p className="text-sm text-red-500">{errs.leaveTypeId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            ชื่อกรณีการลา
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <input
            {...register("caseName")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ชื่อกรณีการลา"
          />
          {errs.caseName && (
            <p className="text-sm text-red-500">{errs.caseName.message}</p>
          )}
        </div>
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
          {submitError}
        </div>
      )}

      <div className="flex justify-end items-center gap-3">
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
