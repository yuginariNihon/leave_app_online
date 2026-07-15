"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Tags, Save, Loader2, Check } from "lucide-react";
import { createLeaveTypeSchema } from "@/lib/TypeSchema";
import type { CreateLeaveTypeValues, UpdateLeaveTypeValues } from "@/lib/TypeSchema";

interface LeaveTypeFormProps {
  mode: "create" | "edit";
  defaultValues?: { leaveTypeName: string; maxDaysPerYear?: number | null; isPaid?: boolean; requiresAttachment?: boolean };
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string;
  onSubmit: (values: CreateLeaveTypeValues | UpdateLeaveTypeValues) => void;
  onCancel: () => void;
}

export function LeaveTypeForm({
  mode,
  defaultValues,
  isSubmitting,
  isSuccess,
  submitError,
  onSubmit,
  onCancel,
}: LeaveTypeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors: errs },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(createLeaveTypeSchema),
    defaultValues: defaultValues ?? { leaveTypeName: "", maxDaysPerYear: null, isPaid: true, requiresAttachment: false },
  });

  const isPaid = watch("isPaid");
  const requiresAttachment = watch("requiresAttachment");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            ชื่อประเภทการลา
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <input
            {...register("leaveTypeName")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ชื่อประเภทการลา"
          />
          {errs.leaveTypeName && (
            <p className="text-sm text-red-500">{errs.leaveTypeName?.message as string}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide">
            จำนวนวันสูงสุดต่อปี
          </label>
          <input
            type="number"
            {...register("maxDaysPerYear")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ไม่จำกัด"
          />
          {errs.maxDaysPerYear && (
            <p className="text-sm text-red-500">{errs.maxDaysPerYear?.message as string}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide">ได้เงิน</label>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={isPaid === true}
              onPressedChange={(p) => setValue("isPaid", p, { shouldValidate: true })}
              variant="outline"
              className="h-10 px-5 text-base data-[state=on]:bg-emerald-50 data-[state=on]:text-emerald-700 data-[state=on]:border-emerald-300"
            >
              {isPaid === true && <Check className="w-4 h-4" />}
              ได้เงิน
            </Toggle>
            <Toggle
              pressed={isPaid === false}
              onPressedChange={(p) => setValue("isPaid", !p, { shouldValidate: true })}
              variant="outline"
              className="h-10 px-5 text-base data-[state=on]:bg-red-50 data-[state=on]:text-red-700 data-[state=on]:border-red-300"
            >
              {isPaid === false && <Check className="w-4 h-4" />}
              ไม่ได้เงิน
            </Toggle>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide">ต้องแนบเอกสาร</label>
          <div className="flex items-center gap-2">
            <Toggle
              pressed={requiresAttachment === true}
              onPressedChange={(p) => setValue("requiresAttachment", p, { shouldValidate: true })}
              variant="outline"
              className="h-10 px-5 text-base data-[state=on]:bg-amber-50 data-[state=on]:text-amber-700 data-[state=on]:border-amber-300"
            >
              {requiresAttachment === true && <Check className="w-4 h-4" />}
              ต้องแนบ
            </Toggle>
            <Toggle
              pressed={requiresAttachment === false}
              onPressedChange={(p) => setValue("requiresAttachment", !p, { shouldValidate: true })}
              variant="outline"
              className="h-10 px-5 text-base data-[state=on]:bg-slate-100 data-[state=on]:text-slate-700 data-[state=on]:border-slate-300"
            >
              {requiresAttachment === false && <Check className="w-4 h-4" />}
              ไม่ต้องแนบ
            </Toggle>
          </div>
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
