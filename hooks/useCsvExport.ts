"use client";

import { useCallback } from "react";
import { createCsv } from "@/lib/csv";
import { downloadCsv } from "@/lib/utils";

type UseCsvExportOptions<T> = {
  /** ชื่อไฟล์หลัก (จะเติมวันที่ให้อัตโนมัติ) เช่น `"departments"` → `departments_2026-10-28.csv` */
  filename: string;
  columns: readonly string[];
  /** แปลง 1 แถวเป็น cell ดิบ — การ escape/กัน formula injection ทำใน `createCsv` ให้แล้ว */
  toRow: (row: T) => readonly unknown[];
};

/**
 * สร้างไฟล์ CSV ฝั่ง client จากข้อมูลที่โหลดมาแล้ว
 * (ฝั่ง server ใช้ `csvStreamResponse` ใน `lib/http.ts` แทน)
 */
export function useCsvExport<T>({ filename, columns, toRow }: UseCsvExportOptions<T>) {
  return useCallback(
    (rows: readonly T[]) => {
      const day = new Date().toISOString().split("T")[0];
      const content = createCsv(columns, rows.map(toRow));
      downloadCsv(`${filename}_${day}.csv`, content);
    },
    [filename, columns, toRow],
  );
}
