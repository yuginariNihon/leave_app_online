import { describe, expect, it } from "vitest";
import {
  countInclusiveDays,
  csvCell,
  formatDateOnly,
  minutesToTime,
  parseDateOnly,
  timeFromDb,
} from "@/lib/utils";

describe("csvCell", () => {
  it("wraps values in quotes and escapes inner quotes", () => {
    expect(csvCell("hello")).toBe('"hello"');
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
  });

  it("renders null/undefined as an empty cell and numbers as-is", () => {
    expect(csvCell(null)).toBe('""');
    expect(csvCell(undefined)).toBe('""');
    expect(csvCell(5)).toBe('"5"');
  });

  it("neutralises formula injection", () => {
    expect(csvCell("=SUM(A1)")).toBe('"\'=SUM(A1)"');
    expect(csvCell("+1")).toBe('"\'+1"');
    expect(csvCell("-1")).toBe('"\'-1"');
    expect(csvCell("@cmd")).toBe('"\'@cmd"');
    expect(csvCell("\tcmd")).toBe('"\'\tcmd"');
    expect(csvCell("\rcmd")).toBe('"\'\rcmd"');
  });
});

describe("parseDateOnly", () => {
  it("parses ISO and slash/dot dates as UTC", () => {
    expect(parseDateOnly("2026-10-23")?.toISOString()).toBe("2026-10-23T00:00:00.000Z");
    expect(parseDateOnly("2026/1/5")?.toISOString()).toBe("2026-01-05T00:00:00.000Z");
    expect(parseDateOnly("2026.10.23")?.toISOString()).toBe("2026-10-23T00:00:00.000Z");
    expect(parseDateOnly("20261023")?.toISOString()).toBe("2026-10-23T00:00:00.000Z");
  });

  it("parses day-first dates", () => {
    expect(parseDateOnly("23/10/2026")?.toISOString()).toBe("2026-10-23T00:00:00.000Z");
    expect(parseDateOnly("01/02/2026")?.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("rejects empty and unparseable values", () => {
    expect(parseDateOnly(null)).toBeNull();
    expect(parseDateOnly("")).toBeNull();
    expect(parseDateOnly("not-a-date")).toBeNull();
  });
});

describe("countInclusiveDays", () => {
  it("counts both endpoints", () => {
    expect(countInclusiveDays("2026-10-01", "2026-10-03")).toBe(3);
    expect(countInclusiveDays("2026-10-01", "2026-10-01")).toBe(1);
  });
});

describe("time helpers", () => {
  it("formats minutes as HH:mm", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(90)).toBe("01:30");
    expect(minutesToTime(23 * 60 + 59)).toBe("23:59");
  });

  it("reads HH:mm from a @db.Time Date in UTC", () => {
    expect(timeFromDb(new Date(Date.UTC(1970, 0, 1, 9, 5)))).toBe("09:05");
    expect(timeFromDb("1970-01-01T20:30:00.000Z")).toBe("20:30");
    expect(timeFromDb(null)).toBeNull();
    expect(timeFromDb("not-a-date")).toBeNull();
  });

  it("formats UTC dates as DD/MM/YYYY", () => {
    expect(formatDateOnly("2026-10-23T00:00:00.000Z")).toBe("23/10/2026");
    expect(formatDateOnly(null)).toBe("-");
  });
});
