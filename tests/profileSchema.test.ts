import { describe, expect, it } from "vitest";
import { updateMyProfileSchema } from "@/lib/TypeSchema";

describe("updateMyProfileSchema", () => {
  it("trims the name", () => {
    const parsed = updateMyProfileSchema.parse({ name: "  สมชาย ใจดี  " });
    expect(parsed.name).toBe("สมชาย ใจดี");
  });

  it("rejects an empty or whitespace-only name with a Thai message", () => {
    for (const name of ["", "   "]) {
      const result = updateMyProfileSchema.safeParse({ name });
      expect(result.success).toBe(false);
      expect(result.success ? [] : result.error.issues[0].message).toBe(
        "กรุณากรอกชื่อ-นามสกุล",
      );
    }
  });

  it("rejects a name longer than 100 characters", () => {
    const result = updateMyProfileSchema.safeParse({ name: "a".repeat(101) });
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues[0].message).toBe(
      "ชื่อ-นามสกุลต้องไม่เกิน 100 ตัวอักษร",
    );
  });

  it("accepts null phone/email and omits them when absent", () => {
    expect(updateMyProfileSchema.parse({ name: "A" })).toEqual({ name: "A" });
    expect(
      updateMyProfileSchema.parse({ name: "A", phoneNumber: null, email: null }),
    ).toEqual({ name: "A", phoneNumber: null, email: null });
  });

  it("does not enforce the email format (legacy rows stay editable)", () => {
    const result = updateMyProfileSchema.safeParse({
      name: "A",
      email: "not-an-email",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-string phone/email", () => {
    expect(
      updateMyProfileSchema.safeParse({ name: "A", phoneNumber: 123 }).success,
    ).toBe(false);
    expect(updateMyProfileSchema.safeParse({ name: "A", email: 1 }).success).toBe(
      false,
    );
  });
});
