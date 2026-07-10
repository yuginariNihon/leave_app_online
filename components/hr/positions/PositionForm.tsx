"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Briefcase, Save, Loader2, ArrowLeft } from "lucide-react";
import { createPositionSchema, updatePositionSchema } from "@/lib/TypeSchema";
import type { CreatePositionValues, UpdatePositionValues } from "@/lib/TypeSchema";

interface PositionFormProps {
  mode: "create" | "edit";
  defaultValues?: { positionName: string; positionLevel?: number | null };
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError: string;
  onSubmit: (values: CreatePositionValues | UpdatePositionValues) => void;
  onCancel: () => void;
}

export function PositionForm({
  mode,
  defaultValues,
  isSubmitting,
  isSuccess,
  submitError,
  onSubmit,
  onCancel,
}: PositionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors: errs },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<any>({
    resolver: zodResolver(createPositionSchema),
    defaultValues: defaultValues ?? { positionName: "", positionLevel: null },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide flex items-center gap-1">
            ชื่อตำแหน่ง
            <span className="text-[#ba1a1a] text-xs">*</span>
          </label>
          <input
            {...register("positionName")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ชื่อตำแหน่ง"
          />
          {errs.positionName && (
            <p className="text-sm text-red-500">{errs.positionName?.message as string}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#45464d] tracking-wide">
            ระดับตำแหน่ง
          </label>
          <input
            type="number"
            {...register("positionLevel")}
            className="w-full px-4 py-3 rounded-xl border border-[#c6c6cd] bg-white text-base transition-all outline-none focus:border-[#2563EB] focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)]"
            placeholder="ระดับตำแหน่ง (ไม่บังคับ)"
          />
          {errs.positionLevel && (
            <p className="text-sm text-red-500">{errs.positionLevel?.message as string}</p>
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
