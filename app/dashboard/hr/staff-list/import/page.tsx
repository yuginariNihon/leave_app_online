"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

type PreviewRow = Record<string, string>;

export default function ImportStaffPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: { row: number; message: string }[] } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());

      if (lines.length < 2) {
        toast.error("ไฟล์ต้องมี header และข้อมูลอย่างน้อย 1 แถว");
        return;
      }

      const cols = parseCSVLine(lines[0]);
      setHeaders(cols);

      const rows: PreviewRow[] = [];
      for (let i = 1; i < Math.min(lines.length, 21); i++) {
        const vals = parseCSVLine(lines[i]);
        const row: PreviewRow = {};
        cols.forEach((c, idx) => { row[c] = vals[idx] ?? ""; });
        rows.push(row);
      }
      setPreview(rows);
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const cols = parseCSVLine(lines[0]);

      const rows: Array<Record<string, string>> = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        const row: Record<string, string> = {};
        cols.forEach((c, idx) => { row[c] = vals[idx] ?? ""; });
        rows.push(row);
      }

      setImporting(true);
      try {
        const res = await fetch("/api/hr/staff/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const json = await res.json();
        if (!res.ok) {
          if (json.schemaErrors) {
            toast.error(`ข้อมูลไม่ถูกต้อง ${json.schemaErrors.length} รายการ`);
          } else {
            throw new Error(json.error ?? "Import failed");
          }
        }
        setResult(json);
        if (json.errors?.length === 0) {
          toast.success(`นำเข้ารายชื่อพนักงาน ${json.success} รายการเรียบร้อยแล้ว`);
        } else if (json.success > 0) {
          toast.success(`นำเข้า ${json.success} รายการ สำเร็จ มีข้อผิดพลาด ${json.errors.length} รายการ`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <main className="flex-1 overflow-y-auto">
        <section className="flex-1 px-4 md:px-10 py-8 md:py-12 bg-[#F8FAFC]">
          <div className="max-w-4xl mx-auto">
            <AppBreadcrumb
                className="mb-6"
                items={[
                  { label: "Home", href: "/dashboard" },
                  { label: "HR", href: "/dashboard/hr" },
                  { label: "Staff List", href: "/dashboard/hr/staff-list" },
                  { label: "Import" },
                ]}
              />

            <div
              className="bg-white rounded-2xl border border-[#c6c6cd]/30 overflow-hidden"
              style={{ boxShadow: "0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 8px -1px rgba(15, 23, 42, 0.03)" }}
            >
            <div className="bg-[#0F172A] p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex gap-3">
                  <div className="hidden md:flex w-16 h-16 rounded-2xl bg-white/5 border border-white/10 items-center justify-center backdrop-blur-md">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[28px] md:text-[32px] font-semibold text-white leading-9 md:leading-10 tracking-[-0.01em]">
                      นำเข้ารายชื่อพนักงาน
                    </h2>
                    <p className="text-sm text-[#dae2fd]">
                      อัปโหลดไฟล์ CSV เพื่อนำเข้าข้อมูลพนักงานจำนวนมาก
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 text-white hover:text-[#100d41]"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    ย้อนกลับ
                  </Button>
                  
                </div>
              </div>

              <div className="p-8 space-y-6">
                {/* Upload Section */}
                {!file && (
                  <div
                    className="border-2 border-dashed border-[#c6c6cd] rounded-2xl p-12 text-center hover:border-[#0F172A] transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-10 h-10 text-[#45464d] mx-auto mb-3" />
                    <p className="text-base font-semibold text-[#0F172A]">
                      คลิกเพื่อเลือกไฟล์ CSV
                    </p>
                    <p className="text-sm text-[#45464d] mt-1">
                      หรือลากไฟล์มาวางที่นี่
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* File Info & Preview */}
                {file && !result && (
                  <>
                    <div className="flex items-center justify-between p-4 bg-[#f2f4f6] rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#0F172A]" />
                        <span className="text-sm font-medium text-[#0F172A]">{file.name}</span>
                        <span className="text-xs text-[#45464d]">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-sm text-[#45464d] h-8 px-3"
                          onClick={handleReset}
                        >
                          เปลี่ยนไฟล์
                        </Button>
                        <Button
                          type="button"
                          disabled={importing}
                          className="bg-[#0F172A] hover:bg-[#1E293B] text-white h-9 px-5 text-sm font-semibold rounded-lg"
                          onClick={handleImport}
                        >
                          {importing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />กำลังนำเข้า...</>
                          ) : (
                            <><Upload className="w-3.5 h-3.5 mr-1.5" />นำเข้าข้อมูล</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Column Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-blue-700">
                          <p className="font-semibold mb-1">รูปแบบไฟล์ CSV:</p>
                          <p>คอลัมน์ที่จำเป็น: <strong>staffCode</strong>, <strong>name</strong>, <strong>departmentName</strong>, <strong>positionName</strong></p>
                          <p>คอลัมน์เพิ่มเติม: sectionName, employmentTypeName, phoneNumber, dateOfBirth (YYYY-MM-DD), startDate (YYYY-MM-DD)</p>
                        </div>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div>
                      <h3 className="text-sm font-semibold text-[#0F172A] mb-3">
                        ตัวอย่างข้อมูล ({Math.min(preview.length, 20)} รายการจากทั้งหมด)
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-[#c6c6cd]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-[#f2f4f6]">
                              {headers.map((h) => (
                                <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#0F172A] whitespace-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {preview.slice(0, 10).map((row, idx) => (
                              <tr key={idx} className="border-t border-[#c6c6cd]/50">
                                {headers.map((h) => (
                                  <td key={h} className="px-4 py-2 text-[#45464d] whitespace-nowrap">
                                    {row[h] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {/* Result Summary */}
                {result && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          นำเข้าสำเร็จ {result.success} รายการ
                        </span>
                      </div>
                      <Button
                        type="button"
                        className="bg-[#0F172A] hover:bg-[#1E293B] text-white h-9 px-5 text-sm font-semibold rounded-lg"
                        onClick={() => router.push("/dashboard/hr/staff-list")}
                      >
                        ไปยังรายชื่อพนักงาน
                      </Button>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 p-4 border-b border-red-200">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            ข้อผิดพลาด {result.errors.length} รายการ
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {result.errors.map((err, idx) => (
                            <div key={idx} className="px-4 py-2 text-sm text-red-600 border-b border-red-100 last:border-0">
                              แถวที่ {err.row}: {err.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-sm text-[#45464d]"
                        onClick={handleReset}
                      >
                        นำเข้าไฟล์อื่น
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>    {/* bg-white */}
          </div>      {/* max-w-4xl */}
        </section>
      </main>
    </div>
  );
}


function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}
