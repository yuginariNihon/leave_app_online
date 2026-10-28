type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function configuredLevel(): LogLevel {
  const raw = process.env.LOG_LEVEL?.toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

/**
 * Minimal dependency-free logger shared by server code. `console` is the only
 * sink available in both the Node and Edge runtimes; this wrapper adds a
 * consistent prefix and a `LOG_LEVEL` switch so noisy debug logs can be turned
 * off in production without touching call sites.
 */
function write(level: LogLevel, scope: string, message: string, meta?: unknown): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[configuredLevel()]) return;

  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} [${scope}] ${message}`;
  const args: unknown[] = meta === undefined ? [line] : [line, meta];

  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.log(...args);
}

export const logger = {
  debug(scope: string, message: string, meta?: unknown) {
    write("debug", scope, message, meta);
  },
  info(scope: string, message: string, meta?: unknown) {
    write("info", scope, message, meta);
  },
  warn(scope: string, message: string, meta?: unknown) {
    write("warn", scope, message, meta);
  },
  error(scope: string, message: string, meta?: unknown) {
    write("error", scope, message, meta);
  },
};
