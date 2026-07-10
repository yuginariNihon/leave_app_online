"use client";

import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUp } from "lucide-react";

function countInclusiveDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
}

export function LeaveRequestModal({ children }: { children?: React.ReactNode }) {
  const [startDate, setStartDate] = useState("2025-05-12");
  const [endDate, setEndDate] = useState("2025-05-16");
  const [fileName, setFileName] = useState("Choose File...");

  const dayCount = useMemo(
    () => countInclusiveDateRange(startDate, endDate),
    [startDate, endDate],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("Choose File...");
    }
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    // If start date is after end date, update end date to match start date
    if (new Date(newStart) > new Date(endDate)) {
      setEndDate(newStart);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    // Only update if end date is not before start date
    if (new Date(newEnd) >= new Date(startDate)) {
      setEndDate(newEnd);
    } else {
      // If user tries to pick date before start date, force it to start date
      setEndDate(startDate);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || <Button className="bg-[#100d41] hover:bg-[#1a1752]">ยื่นใบลา</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-full md:max-w-3xl lg:max-w-4xl p-0 overflow-hidden border-none gap-0">
        <DialogHeader className="bg-[#100d41] text-white px-6 py-4 flex flex-row justify-between items-center">
          <DialogTitle className="text-xl font-medium tracking-wide">ยื่นใบลา</DialogTitle>
          <DialogDescription className="sr-only">
            แบบฟอร์มสำหรับยื่นคำขอลาออนไลน์
          </DialogDescription>
        </DialogHeader>

        <div className="relative p-6 md:p-8 bg-white pb-10">
          {/* Background Decorative Hexagons */}
          <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 opacity-[0.03] text-[#100d41]">
              <svg fill="currentColor" height="200" viewBox="0 0 100 100" width="200">
                <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"></path>
              </svg>
            </div>
            <div className="absolute -bottom-12 -left-12 opacity-[0.03] text-[#100d41]">
              <svg fill="currentColor" height="250" viewBox="0 0 100 100" width="250">
                <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"></path>
              </svg>
            </div>
          </div>

          <form className="relative z-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="leave-type" className="text-slate-700">
                  ประเภทการลา<span className="text-red-500 ml-1">*</span>
                </Label>
                <Select defaultValue="vacation">
                  <SelectTrigger className="w-full bg-white/80 border-gray-300">
                    <SelectValue placeholder="เลือกประเภทการลา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">ลาพักร้อน</SelectItem>
                    <SelectItem value="sick">ลากิจ</SelectItem>
                    <SelectItem value="personal">ลาป่วย</SelectItem>
                    <SelectItem value="other">อื่นๆ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-written" className="text-slate-700">
                  วันที่เขียนใบลา<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="date"
                  id="date-written"
                  className="bg-gray-50 border-gray-300 cursor-not-allowed opacity-70"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-slate-700">
                  วันที่เริ่มต้น<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="date"
                  id="start-date"
                  className="bg-white/80 border-gray-300"
                  value={startDate}
                  max={endDate}
                  onChange={handleStartDateChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-slate-700">
                  วันที่สิ้นสุด<span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="date"
                  id="end-date"
                  className="bg-white/80 border-gray-300"
                  value={endDate}
                  min={startDate}
                  onChange={handleEndDateChange}
                />
              </div>
            </div>

            <div className="text-[#100d41] font-medium text-lg">
              จำนวนวันลา : <span className="font-semibold">{dayCount}</span> วัน
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-700">
                เหตุผลการลา<span className="text-red-500 ml-1">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Type here..."
                className="bg-white/80 border-gray-300 min-h-[100px] resize-none"
              />
            </div>

            {/* ⚠️ File upload — not yet implemented (UI hidden, keep code) */}
            {false && (
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-slate-700">
                  แนบไฟล์ (ถ้ามี)
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Label
                    htmlFor="file-upload"
                    className="flex items-center justify-between w-full md:w-3/5 border border-gray-300 rounded-md px-4 py-2 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <span className={fileName === "Choose File..." ? "text-gray-400 text-sm font-normal" : "text-slate-800 text-sm font-normal"}>
                      {fileName}
                    </span>
                    <FileUp className="h-5 w-5 text-gray-400" />
                  </Label>
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="bg-white px-6 py-4 border-t border-gray-100 flex flex-row justify-end gap-3 sm:justify-end mb-3">
          <DialogClose asChild>
            <Button
              variant="outline"
              className="px-8 h-11 min-w-[140px] border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
            >
              ปิด
            </Button>
          </DialogClose>
          <Button
            className="px-8 h-11 min-w-[140px] bg-[#100d41] text-white hover:bg-[#1a1752] font-medium shadow-md transition-all active:scale-95"
          >
            ส่งคำขอลา
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
