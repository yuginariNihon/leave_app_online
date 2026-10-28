export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const sanitized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}

/**
 * ประกอบไฟล์ CSV ฝั่ง client (BOM + หัวตาราง + แถวข้อมูล)
 * ฝั่ง server ใช้ `csvStreamResponse` (`lib/http.ts`) ซึ่ง escape ด้วย `csvRow` เหมือนกัน
 */
export function createCsv(
  columns: readonly string[],
  rows: ReadonlyArray<readonly unknown[]>,
): string {
  const lines = [csvRow([...columns]), ...rows.map((row) => csvRow([...row]))];
  return `\uFEFF${lines.join("\n")}`;
}
