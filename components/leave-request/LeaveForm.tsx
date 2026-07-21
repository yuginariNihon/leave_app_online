"use client";

import React, { useEffect, useMemo } from "react";
import { UseFormReturn, Controller, useWatch } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "./DatePicker";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeaveFormValues } from "@/lib/TypeSchema";
import type {
  LeaveCaseSelectOption,
  LeaveSelectOption,
} from "@/lib/TypeSchema";

interface LeaveFormProps {
  form: UseFormReturn<LeaveFormValues>;
  leaveTypeOptions: LeaveSelectOption[];
  leaveCaseOptions: LeaveCaseSelectOption[];
  leaveQuota?: Record<string, { usedDays: number; maxDays: number; remaining: number }>;
  isQuotaExceeded?: boolean;
  optionsLoading?: boolean;
  dayCount: number;
  onSubmit: (values: LeaveFormValues) => void;
  createdAt?: string;
  holidays?: string[];
}

export function LeaveForm({form,leaveTypeOptions,leaveCaseOptions,leaveQuota = {},isQuotaExceeded = false,optionsLoading = false,dayCount,onSubmit,createdAt,holidays = [],}: LeaveFormProps) {
  const {register,control,handleSubmit,setValue,clearErrors,formState: { errors },} = form;

  const leaveTypeId = useWatch({ control, name: "leaveTypeId" });
  const leaveCaseId = useWatch({ control, name: "leaveCaseId" });
  const startDate = useWatch({ control, name: "startDate" });
  const endDate = useWatch({ control, name: "endDate" });

  const filteredLeaveCases = useMemo(
    () =>
      leaveTypeId
        ? leaveCaseOptions.filter((option) => option.leaveTypeId === leaveTypeId)
        : [],
    [leaveCaseOptions, leaveTypeId],
  );

  const firstLeaveCaseId = filteredLeaveCases[0]?.id;

  useEffect(() => {
    if (filteredLeaveCases.length === 0) {
      if (leaveCaseId) {
        setValue("leaveCaseId", "", { shouldValidate: true });
      }
      return;
    }

    if (!leaveCaseId || !filteredLeaveCases.some((option) => option.id === leaveCaseId)) {
      setValue("leaveCaseId", firstLeaveCaseId, { shouldValidate: true });
    }
  }, [leaveTypeId, leaveCaseId, filteredLeaveCases, firstLeaveCaseId, setValue]);

  return (
    <form id="leave-request-form" onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-8">
      <div className="flex justify-end text-md font-bold text-slate-700">
        วันที่เขียนใบลา : {createdAt ? new Date(createdAt).toLocaleDateString("th-TH",{}) : new Date().toLocaleDateString("th-TH",{})}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ประเภทการลา */}
        <div className="space-y-3">
          <Label htmlFor="leave-type" className="text-sm font-semibold text-slate-700">
            ประเภทการลา<span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            control={control}
            name="leaveTypeId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                disabled={optionsLoading || leaveTypeOptions.length === 0}
              >
                <SelectTrigger className="w-full !h-11 bg-white border-gray-200 focus:ring-[#100d41]">
                  <SelectValue
                    placeholder={
                      optionsLoading ? "กำลังโหลด..." : "เลือกประเภทการลา"
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  sideOffset={4}
                >
                  {leaveTypeOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.leaveTypeId && (
            <p className="text-sm text-red-500">{errors.leaveTypeId.message}</p>
          )}
          {leaveTypeId && leaveQuota[leaveTypeId] && (
            <p className="text-sm text-slate-700 mt-1">
              วันลาคงเหลือ: <span className="font-semibold text-[#100d41]">{leaveQuota[leaveTypeId].remaining}</span> / {leaveQuota[leaveTypeId].maxDays} วัน
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="leave-case" className="text-sm font-semibold text-slate-700">
            กรณีการลา<span className="text-red-500 ml-1">*</span>
          </Label>
          <Controller
            control={control}
            name="leaveCaseId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={
                  optionsLoading ||
                  !leaveTypeId ||
                  filteredLeaveCases.length === 0
                }
              >
                <SelectTrigger className="w-full !h-11 bg-white border-gray-200 focus:ring-[#100d41]">
                  <SelectValue
                    placeholder={
                      optionsLoading
                        ? "กำลังโหลด..."
                        : !leaveTypeId
                          ? "เลือกประเภทการลาก่อน"
                          : filteredLeaveCases.length === 0
                            ? "ไม่มีกรณีการลาสำหรับประเภทนี้"
                            : "เลือกกรณีการลา"
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="start"
                  sideOffset={4}
                >
                  {filteredLeaveCases.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.leaveCaseId && (
            <p className="text-sm text-red-500">{errors.leaveCaseId.message}</p>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* วันที่เริ่มต้น */}
        <div className="space-y-3">
          <Label htmlFor="start-date" className="text-sm font-semibold text-slate-700">
            วันที่เริ่มต้น<span className="text-red-500 ml-1">*</span>
          </Label>
          <DatePicker
            value={startDate}
            onChange={(v) => {
              setValue("startDate", v, { shouldValidate: true });
              clearErrors("startDate");
              if (new Date(v) > new Date(endDate)) {
                setValue("endDate", v, { shouldValidate: true });
              }
            }}
            max={endDate || undefined}
            holidays={holidays}
            placeholder="เลือกวันที่เริ่มต้น"
          />
          {errors.startDate && (
            <p className="text-sm text-red-500">{errors.startDate.message}</p>
          )}
        </div>

        {/* วันที่สิ้นสุด */}
        <div className="space-y-3">
          <Label htmlFor="end-date" className="text-sm font-semibold text-slate-700">
            วันที่สิ้นสุด<span className="text-red-500 ml-1">*</span>
          </Label>
          <DatePicker
            value={endDate}
            onChange={(v) => {
              clearErrors("endDate");
              if (new Date(v) >= new Date(startDate)) {
                setValue("endDate", v, { shouldValidate: true });
              } else {
                setValue("endDate", startDate, { shouldValidate: true });
              }
            }}
            min={startDate || undefined}
            holidays={holidays}
            placeholder="เลือกวันที่สิ้นสุด"
          />
          {errors.endDate && (
            <p className="text-sm text-red-500">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* ช่วงเวลา */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700">
          ช่วงเวลา
        </Label>
        <Controller
          control={control}
          name="leavePeriod"
          render={({ field }) => (
            <div className="flex flex-wrap gap-6">
              {[
                { value: "full_day", label: "เต็มวัน" },
                { value: "morning", label: "ครึ่งเช้า" },
                { value: "afternoon", label: "ครึ่งบ่าย" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                    (field.value || "full_day") === option.value
                      ? "border-[#100d41] bg-[#100d41]/5 text-[#100d41] font-semibold"
                      : "border-gray-200 bg-white text-slate-600 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    checked={(field.value || "full_day") === option.value}
                    onChange={() => field.onChange(option.value)}
                    className="sr-only"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        />
      </div>

      {/* จำนวนวันลา */}
      <div className="rounded-lg inline-block border border-slate-100">
        <span className="text-[#100d41] font-medium text-lg">
          จำนวนวันลา : <span className="font-bold text-2xl ml-1">{dayCount % 1 === 0 ? dayCount.toString() : dayCount.toFixed(1)}</span> วัน
        </span>
      </div>
      {isQuotaExceeded && (
        <p className="text-md text-red-600 font-medium">
          จำนวนวันที่ขอ {dayCount} วัน เกินวันลาคงเหลือ {leaveQuota[leaveTypeId]?.remaining ?? 0} วัน — ไม่สามารถส่งคำขอลาได้
        </p>
      )}

      {/* เหตุผลการลา */}
      <div className="space-y-3">
        <Label htmlFor="reason" className="text-sm font-semibold text-slate-700">
          เหตุผลการลา<span className="text-red-500 ml-1">*</span>
        </Label>
        <Textarea
          id="reason"
          placeholder="ระบุเหตุผลการลาของคุณที่นี่..."
          className="bg-white border-gray-200 min-h-[150px] resize-none focus:ring-[#100d41]"
          {...register("reason")}
        />
        {errors.reason && (
          <p className="text-sm text-red-500">{errors.reason.message}</p>
        )}
      </div>

      {/* ⚠️ File upload — not yet implemented (UI hidden, keep code) */}
      {/*false && (
        <div className="space-y-3">
          <Label htmlFor="file-upload" className="text-sm font-semibold text-slate-700">
            แนบไฟล์ (ถ้ามี)
          </Label>
          <div className="relative group">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onFileChange}
            />
            <Label
              htmlFor="file-upload"
              className="flex items-center justify-between w-full md:w-3/5 border-2 border-dashed border-gray-300 rounded-xl px-6 py-4 bg-white cursor-pointer hover:border-[#100d41] hover:bg-slate-50 transition-all"
            >
              <div className="flex items-center gap-3">
                <FileUp className="h-6 w-6 text-slate-400 group-hover:text-[#100d41]" />
                <span
                  className={
                    fileName === "Choose File..."
                      ? "text-slate-400 font-normal"
                      : "text-[#100d41] font-medium"
                  }
                >
                  {fileName}
                </span>
              </div>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Browse
              </span>
            </Label>
          </div>
          {fileError && (
            <p className="text-sm text-red-500 mt-2">{fileError}</p>
          )}
        </div>
      )*/}
    </form>
  );
}
