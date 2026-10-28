export function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  const sanitized = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",");
}
