import { describe, expect, it } from "vitest";
import {
  AUTO_CANCEL_DAYS_DEFAULT,
  AUTO_CANCEL_REASON_PREFIX,
  autoCancelCutoff,
  autoCancelReason,
  isAutoCancelReason,
  shouldAutoCancel,
} from "@/lib/autoCancel";

const NOW = new Date("2026-11-04T00:00:00.000Z");

function daysAgo(days: number, from: Date = NOW): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

function candidate(overrides: Partial<Parameters<typeof shouldAutoCancel>[0]> = {}) {
  return {
    leaveStatus: "pending",
    currentLevel: 1,
    createdAt: daysAgo(31),
    ...overrides,
  };
}

describe("autoCancelCutoff", () => {
  it("ย้อนหลังตามจำนวนวันจาก `now`", () => {
    expect(autoCancelCutoff(NOW, 30).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("ค่าเริ่มต้นคือ 30 วัน", () => {
    expect(AUTO_CANCEL_DAYS_DEFAULT).toBe(30);
    expect(autoCancelCutoff(NOW).toISOString()).toBe(autoCancelCutoff(NOW, 30).toISOString());
  });
});

describe("shouldAutoCancel", () => {
  it("ค้างขั้นแรก 31 วัน → ยกเลิก", () => {
    expect(shouldAutoCancel(candidate(), NOW)).toBe(true);
  });

  it("ค้างขั้นแรก 29 วัน → ไม่ยกเลิก", () => {
    expect(shouldAutoCancel(candidate({ createdAt: daysAgo(29) }), NOW)).toBe(false);
  });

  it("เท่ากับ 30 วันพอดี → ยังไม่ยกเลิก (ต้องเกิน)", () => {
    expect(shouldAutoCancel(candidate({ createdAt: daysAgo(30) }), NOW)).toBe(false);
  });

  it("เกิน 30 วันไป 1 วินาที → ยกเลิก", () => {
    const createdAt = new Date(daysAgo(30).getTime() - 1000);
    expect(shouldAutoCancel(candidate({ createdAt }), NOW)).toBe(true);
  });

  it("อนุมัติขั้นแรกแล้ว (level 2) → ไม่ยกเลิก แม้จะค้างนาน", () => {
    expect(
      shouldAutoCancel(candidate({ currentLevel: 2, createdAt: daysAgo(90) }), NOW),
    ).toBe(false);
  });

  it.each(["approved", "rejected", "cancelled"])(
    "สถานะ %s → ไม่ยกเลิก",
    (leaveStatus) => {
      expect(shouldAutoCancel(candidate({ leaveStatus }), NOW)).toBe(false);
    },
  );

  it("เคารพจำนวนวันที่ override (เช่น 7 วัน)", () => {
    expect(shouldAutoCancel(candidate({ createdAt: daysAgo(10) }), NOW, 7)).toBe(true);
    expect(shouldAutoCancel(candidate({ createdAt: daysAgo(10) }), NOW, 30)).toBe(false);
  });
});

describe("autoCancelReason / isAutoCancelReason", () => {
  it("ใส่จำนวนวันลงในข้อความ", () => {
    expect(autoCancelReason(30)).toBe(
      `${AUTO_CANCEL_REASON_PREFIX} — ไม่มีผู้อนุมัติภายใน 30 วัน`,
    );
    expect(autoCancelReason(7)).toContain("7 วัน");
  });

  it("ตรวจ marker ได้ (ใช้แยกจากกรณีเจ้าของใบลายกเลิกเอง)", () => {
    expect(isAutoCancelReason(autoCancelReason(30))).toBe(true);
    expect(isAutoCancelReason("ลาป่วย")).toBe(false);
    expect(isAutoCancelReason(null)).toBe(false);
    expect(isAutoCancelReason(undefined)).toBe(false);
    expect(isAutoCancelReason("")).toBe(false);
  });
});
