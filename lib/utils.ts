import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import bcrypt from "bcryptjs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toDateOnly(value: string | Date): Date {
  if (value instanceof Date) return value;
  return new Date(`${value}T00:00:00.000Z`);
}

export function countInclusiveDays(startDate: string | Date, endDate: string | Date): number {
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  const msPerDay = 1000 * 60 * 60 * 24;
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.floor((e - s) / msPerDay) + 1;
}

export function dateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.split("T")[0];
}

export function formatDateOnly(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

export function formatLeaveDateRange(start: string | null, end: string | null): string {
  const s = formatShortDate(start);
  if (!end || start === end) return s;
  return `${s} – ${formatShortDate(end)}`;
}

export function formatFullDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const date = d.toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric",
  });
  const time = d.toLocaleTimeString("th-TH", {
    hour: "2-digit", minute: "2-digit",
  });
  return `${date} • ${time} น.`;
}

export function formatThaiDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatThaiShortDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getUTCDate()} ${d.toLocaleDateString("th-TH", { month: "short" })} ${String(d.getUTCFullYear() + 543).slice(-2)}`;
}

export function formatThaiDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  const day = d.getUTCDate();
  const month = d.toLocaleDateString("th-TH", { month: "short" });
  const year = String(d.getUTCFullYear() + 543).slice(-2);
  const hours = d.getUTCHours().toString().padStart(2, "0");
  const minutes = d.getUTCMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} | ${hours}:${minutes} น.`;
}

export function formatDays(totalDays: string | null): string {
  if (!totalDays) return "-";
  const num = Number(totalDays);
  return `${num} วัน`;
}

export function formatFileSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function currentSubmitTime(): string {
  const now = new Date();
  const date = `${now.getDate().toString().padStart(2, "0")}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getFullYear()}`;
  const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} น.`;
  return `${date} เวลา ${time}`;
}

export function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export const styleAlertTextSuccess = "!bg-white !text-green-700 !border !border-green-500";
