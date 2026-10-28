import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/logger";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("filters out levels below the configured threshold", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("LOG_LEVEL", "warn");

    logger.debug("test", "debug message");
    logger.info("test", "info message");
    logger.warn("test", "warn message");

    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain("WARN [test] warn message");
  });

  it("passes error metadata through as a second argument", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("LOG_LEVEL", "debug");

    const cause = new Error("boom");
    logger.error("api", "failed", cause);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][1]).toBe(cause);
  });

  it("defaults to info in production and debug elsewhere", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("LOG_LEVEL", "");

    vi.stubEnv("NODE_ENV", "production");
    logger.debug("test", "hidden");
    expect(log).not.toHaveBeenCalled();

    vi.stubEnv("NODE_ENV", "development");
    logger.debug("test", "visible");
    expect(log).toHaveBeenCalledTimes(1);
  });
});
