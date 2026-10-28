import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/loginNextCookie";

describe("safeNextPath", () => {
  it("accepts dashboard paths with query strings", () => {
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/dashboard/hr")).toBe("/dashboard/hr");
    expect(safeNextPath("/dashboard/leave-details?leaveId=abc")).toBe(
      "/dashboard/leave-details?leaveId=abc",
    );
    expect(safeNextPath(encodeURIComponent("/dashboard/leave-details?leaveId=abc"))).toBe(
      "/dashboard/leave-details?leaveId=abc",
    );
  });

  it("rejects non-dashboard and empty values", () => {
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath("/login")).toBeNull();
    expect(safeNextPath("/dashboard-other")).toBeNull();
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeNextPath("https://evil.com")).toBeNull();
    expect(safeNextPath("//evil.com")).toBeNull();
    expect(safeNextPath("/dashboard//evil.com")).toBeNull();
    expect(safeNextPath(encodeURIComponent("//evil.com"))).toBeNull();
    expect(safeNextPath("/dashboard\\evil")).toBeNull();
  });

  it("rejects control characters and malformed encoding", () => {
    expect(safeNextPath("/dashboard\r\nSet-Cookie: x=1")).toBeNull();
    expect(safeNextPath("%E0%A4%A")).toBeNull();
  });
});
