import { describe, expect, it } from "vitest";
import { createCsv } from "@/lib/csv";

describe("createCsv", () => {
  it("starts with a UTF-8 BOM", () => {
    expect(createCsv(["a"], []).startsWith("\uFEFF")).toBe(true);
  });

  it("quotes the header row and every cell", () => {
    const csv = createCsv(["รหัส", "ชื่อ"], [["D01", "ไอที"]]);
    expect(csv).toBe('\uFEFF"รหัส","ชื่อ"\n"D01","ไอที"');
  });

  it("escapes embedded quotes and protects against formula injection", () => {
    const csv = createCsv(["name"], [['He said "hi"'], ["=1+1"], ["+66"], ["-5"], ["@x"]]);
    const lines = csv.split("\n").slice(1);
    expect(lines).toEqual([
      '"He said ""hi"""',
      `"'=1+1"`,
      `"'+66"`,
      `"'-5"`,
      `"'@x"`,
    ]);
  });

  it("renders null/undefined cells as empty strings", () => {
    const csv = createCsv(["a", "b"], [[null, undefined]]);
    expect(csv.split("\n")[1]).toBe('"",""');
  });
});
