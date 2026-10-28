import { describe, expect, it } from "vitest";
import {
  computeLeaveHours,
  computeLeaveTotalDays,
  parseTimeMinutes,
  periodsConflict,
  type LeaveConflictTarget,
} from "@/lib/services/leaveService";

describe("parseTimeMinutes", () => {
  it("parses HH:mm", () => {
    expect(parseTimeMinutes("00:00")).toBe(0);
    expect(parseTimeMinutes("09:30")).toBe(570);
    expect(parseTimeMinutes("23:59")).toBe(1439);
  });

  it("returns NaN for malformed input", () => {
    expect(Number.isNaN(parseTimeMinutes("bad"))).toBe(true);
  });
});

describe("computeLeaveHours", () => {
  it("computes windows to 2 decimal places", () => {
    expect(computeLeaveHours("09:00", "17:00")).toBe(8);
    expect(computeLeaveHours("11:30", "13:30")).toBe(2);
    expect(computeLeaveHours("09:00", "09:30")).toBe(0.5);
    expect(computeLeaveHours("09:00", "09:20")).toBe(0.33);
  });
});

describe("computeLeaveTotalDays", () => {
  it("counts inclusive days for full-day leave", () => {
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-03")).toBe(3);
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-01")).toBe(1);
  });

  it("halves each day for morning/afternoon", () => {
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-02", "morning")).toBe(1);
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-03", "afternoon")).toBe(1.5);
  });

  it("converts hourly leave to a day-equivalent (8h/day, 2dp)", () => {
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-01", "full_day", "hour", 1.5)).toBe(0.19);
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-01", "full_day", "hour", 4)).toBe(0.5);
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-01", "full_day", "hour", 8)).toBe(1);
    expect(computeLeaveTotalDays("2026-10-01", "2026-10-01", "full_day", "hour", undefined)).toBe(0);
  });
});

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const time = (h: number, m = 0) => new Date(Date.UTC(1970, 0, 1, h, m));

function target(overrides: Partial<LeaveConflictTarget> = {}): LeaveConflictTarget {
  return {
    start_date: day("2026-10-05"),
    end_date: day("2026-10-05"),
    leave_period: "full_day",
    leave_mode: "day",
    start_time: null,
    end_time: null,
    ...overrides,
  };
}

describe("periodsConflict — day vs day", () => {
  it("full day conflicts with everything", () => {
    expect(periodsConflict({ startDate: "2026-10-05", endDate: "2026-10-05" }, target())).toBe(true);
    expect(
      periodsConflict(
        { startDate: "2026-10-05", endDate: "2026-10-05" },
        target({ leave_period: "morning" }),
      ),
    ).toBe(true);
  });

  it("morning and afternoon do not conflict", () => {
    expect(
      periodsConflict(
        { startDate: "2026-10-05", endDate: "2026-10-05", leavePeriod: "morning" },
        target({ leave_period: "afternoon" }),
      ),
    ).toBe(false);
    expect(
      periodsConflict(
        { startDate: "2026-10-05", endDate: "2026-10-05", leavePeriod: "morning" },
        target({ leave_period: "morning" }),
      ),
    ).toBe(true);
  });
});

describe("periodsConflict — hourly", () => {
  it("adjacent windows do not overlap", () => {
    expect(
      periodsConflict(
        {
          startDate: "2026-10-05",
          endDate: "2026-10-05",
          leaveMode: "hour",
          startTime: "09:00",
          endTime: "12:00",
        },
        target({ leave_mode: "hour", leave_period: "full_day", start_time: time(12), end_time: time(13) }),
      ),
    ).toBe(false);
  });

  it("overlapping windows conflict", () => {
    expect(
      periodsConflict(
        {
          startDate: "2026-10-05",
          endDate: "2026-10-05",
          leaveMode: "hour",
          startTime: "09:00",
          endTime: "12:00",
        },
        target({ leave_mode: "hour", leave_period: "full_day", start_time: time(11), end_time: time(13) }),
      ),
    ).toBe(true);
  });

  it("hourly conflicts with a full-day leave on the same date only", () => {
    const hourly = {
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      leaveMode: "hour",
      startTime: "09:00",
      endTime: "10:00",
    };
    expect(periodsConflict(hourly, target())).toBe(true);
    expect(
      periodsConflict(hourly, target({ start_date: day("2026-10-06"), end_date: day("2026-10-06") })),
    ).toBe(false);
  });

  it("hourly intersects the matching half-day window only", () => {
    const afternoonHour = {
      startDate: "2026-10-05",
      endDate: "2026-10-05",
      leaveMode: "hour",
      startTime: "14:00",
      endTime: "16:00",
    };
    expect(periodsConflict(afternoonHour, target({ leave_period: "afternoon" }))).toBe(true);
    expect(periodsConflict(afternoonHour, target({ leave_period: "morning" }))).toBe(false);
  });

  it("day leave vs hourly target respects the half-day window", () => {
    const hourlyMorning = target({
      leave_mode: "hour",
      start_time: time(9),
      end_time: time(12),
    });
    expect(
      periodsConflict(
        { startDate: "2026-10-05", endDate: "2026-10-05", leavePeriod: "morning" },
        hourlyMorning,
      ),
    ).toBe(true);
    expect(
      periodsConflict(
        { startDate: "2026-10-05", endDate: "2026-10-05", leavePeriod: "afternoon" },
        hourlyMorning,
      ),
    ).toBe(false);
  });
});
