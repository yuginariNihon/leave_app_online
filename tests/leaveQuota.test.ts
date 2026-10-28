import { describe, expect, it } from "vitest";
import {
  VACATION_CARRY_OVER_CAP_DAYS,
  VACATION_LEAVE_TYPE_NAME,
  computeDefaultMaxDays,
  getVacationEntitlement,
  isUnconfiguredLeaveType,
  isVacationLeaveType,
  yearsOfServiceFrom,
} from "@/lib/services/leaveQuotaService";

describe("isVacationLeaveType", () => {
  it("matches only the annual leave type name", () => {
    expect(isVacationLeaveType(VACATION_LEAVE_TYPE_NAME)).toBe(true);
    expect(isVacationLeaveType("ลาป่วย")).toBe(false);
    expect(isVacationLeaveType(null)).toBe(false);
    expect(isVacationLeaveType(undefined)).toBe(false);
  });
});

describe("getVacationEntitlement", () => {
  it.each([
    [0, 0],
    [0.99, 0],
    [1, 6],
    [3, 6],
    [3.01, 8],
    [6, 8],
    [6.01, 10],
    [20, 10],
  ])("years=%s -> %s days", (years, expected) => {
    expect(getVacationEntitlement(years)).toBe(expected);
  });
});

describe("yearsOfServiceFrom", () => {
  it("returns null without a start date", () => {
    expect(yearsOfServiceFrom(null)).toBeNull();
    expect(yearsOfServiceFrom(undefined)).toBeNull();
  });

  it("floors whole years", () => {
    const now = Date.now();
    expect(yearsOfServiceFrom(new Date(now))).toBe(0);
    expect(yearsOfServiceFrom(new Date(now - 400 * 86_400_000))).toBe(1);
  });
});

describe("computeDefaultMaxDays", () => {
  it("uses the seniority formula plus capped carry-over for annual leave", () => {
    expect(
      computeDefaultMaxDays({
        leaveTypeName: VACATION_LEAVE_TYPE_NAME,
        maxDaysPerYear: 999,
        yearsOfService: 5,
        carryOverDays: 2,
      }),
    ).toBe(10);
    expect(
      computeDefaultMaxDays({
        leaveTypeName: VACATION_LEAVE_TYPE_NAME,
        maxDaysPerYear: 999,
        yearsOfService: 5,
        carryOverDays: 100,
      }),
    ).toBe(8 + VACATION_CARRY_OVER_CAP_DAYS);
    expect(
      computeDefaultMaxDays({
        leaveTypeName: VACATION_LEAVE_TYPE_NAME,
        maxDaysPerYear: 999,
        yearsOfService: 5,
        carryOverDays: -3,
      }),
    ).toBe(8);
  });

  it("uses max_days_per_year for every other leave type", () => {
    expect(
      computeDefaultMaxDays({
        leaveTypeName: "ลาป่วย",
        maxDaysPerYear: 30,
        yearsOfService: 10,
      }),
    ).toBe(30);
    expect(
      computeDefaultMaxDays({
        leaveTypeName: "ลาป่วย",
        maxDaysPerYear: 0,
        yearsOfService: 10,
      }),
    ).toBe(0);
    expect(
      computeDefaultMaxDays({
        leaveTypeName: "ลาป่วย",
        maxDaysPerYear: null,
        yearsOfService: 10,
      }),
    ).toBe(0);
  });
});

describe("isUnconfiguredLeaveType", () => {
  it("is true only for non-annual types without a default", () => {
    expect(isUnconfiguredLeaveType({ leaveTypeName: "ลาป่วย", maxDaysPerYear: null })).toBe(true);
    expect(isUnconfiguredLeaveType({ leaveTypeName: "ลาป่วย", maxDaysPerYear: 0 })).toBe(false);
    expect(
      isUnconfiguredLeaveType({ leaveTypeName: VACATION_LEAVE_TYPE_NAME, maxDaysPerYear: null }),
    ).toBe(false);
  });
});
