import { describe, expect, it } from "vitest";
import {
  isStalePending,
  waitingDays,
  waitingSinceOf,
  type StalePendingState,
} from "@/lib/autoCancel";

const NOW = new Date("2026-11-18T00:00:00.000Z");

function daysAgo(days: number, from: Date = NOW): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

function state(overrides: Partial<StalePendingState> = {}): StalePendingState {
  return {
    leaveStatus: "pending",
    createdAt: daysAgo(31),
    lastApprovedAt: null,
    ...overrides,
  };
}

describe("waitingSinceOf", () => {
  it("ใช้ acted_at ของขั้นที่อนุมัติล่าสุดเมื่อมี", () => {
    const lastApprovedAt = daysAgo(5);
    expect(waitingSinceOf(state({ lastApprovedAt }))).toBe(lastApprovedAt);
  });

  it("ยังไม่มีใครอนุมัติ → ใช้ created_at", () => {
    const createdAt = daysAgo(10);
    expect(waitingSinceOf(state({ createdAt, lastApprovedAt: null }))).toBe(createdAt);
  });
});

describe("waitingDays", () => {
  it("ปัดลงเป็นจำนวนเต็มวัน", () => {
    expect(waitingDays(daysAgo(33), NOW)).toBe(33);
    expect(waitingDays(new Date(NOW.getTime() - 33.9 * 24 * 60 * 60 * 1000), NOW)).toBe(33);
  });

  it("ไม่มีค่าติดลบ (วันที่ในอนาคต)", () => {
    expect(waitingDays(daysAgo(-3), NOW)).toBe(0);
  });
});

describe("isStalePending", () => {
  it("ขั้นแรก ค้าง 31 วัน → เตือน", () => {
    expect(isStalePending(state({ createdAt: daysAgo(31) }), NOW)).toBe(true);
  });

  it("ขั้นแรก ค้าง 30 วันพอดี → ยังไม่เตือน (ต้องเกิน)", () => {
    expect(isStalePending(state({ createdAt: daysAgo(30) }), NOW)).toBe(false);
  });

  it("ค้างขั้น 3: อนุมัติขั้น 2 เมื่อ 33 วันก่อน → เตือน (เคสจริง)", () => {
    expect(
      isStalePending(
        state({ leaveStatus: "pending", createdAt: daysAgo(50), lastApprovedAt: daysAgo(33) }),
        NOW,
      ),
    ).toBe(true);
  });

  it("ค้างขั้น 3: เพิ่งเข้าขั้นล่าสุด 5 วัน แม้ยื่นมานาน 50 วัน → ไม่เตือน", () => {
    expect(
      isStalePending(
        state({ leaveStatus: "pending", createdAt: daysAgo(50), lastApprovedAt: daysAgo(5) }),
        NOW,
      ),
    ).toBe(false);
  });

  it.each(["approved", "rejected", "cancelled"])("สถานะ %s → ไม่เตือน", (leaveStatus) => {
    expect(
      isStalePending(state({ leaveStatus, createdAt: daysAgo(90), lastApprovedAt: null }), NOW),
    ).toBe(false);
  });

  it("เคารพจำนวนวันที่ override", () => {
    const s = state({ createdAt: daysAgo(10) });
    expect(isStalePending(s, NOW, 7)).toBe(true);
    expect(isStalePending(s, NOW, 30)).toBe(false);
  });

  it("สอดคล้องกับ auto-cancel สำหรับใบขั้นแรก (จุดเริ่มนับเดียวกัน)", () => {
    const s = state({ createdAt: daysAgo(45), lastApprovedAt: null });
    expect(isStalePending(s, NOW)).toBe(true);
    // ใบขั้น 1 ไม่มี acted_at → waitingSince = created_at = เงื่อนไขของ cron
    expect(waitingSinceOf(s)).toBe(s.createdAt);
  });
});
