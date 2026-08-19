import { afterEach, describe, expect, it, vi } from "vitest";
import { log, type LogEntry } from "@/lib/logging/logger";

const CLOSED_FIELD_SET = [
  "timestamp",
  "level",
  "method",
  "path",
  "statusCode",
  "durationMs",
  "userId",
  "requestId",
  "entityType",
  "entityId",
  "errorCode",
  "errorName",
] as const;

let spy: ReturnType<typeof vi.spyOn>;

afterEach(() => {
  spy?.mockRestore();
});

function captureLog(entry: LogEntry): string {
  spy = vi.spyOn(console, "log").mockImplementation(() => {});
  log(entry);
  const firstCall = spy.mock.calls[0];
  if (!firstCall) {
    throw new Error("log() produced no output");
  }
  return String(firstCall[0]);
}

describe("log", () => {
  it("emits one line of valid JSON containing only the closed field set", () => {
    const output = captureLog({
      level: "info",
      method: "GET",
      path: "/",
      statusCode: 200,
    });

    expect(output).not.toContain("\n");
    const record = JSON.parse(output) as Record<string, unknown>;
    expect(record).toMatchObject({
      level: "info",
      method: "GET",
      path: "/",
      statusCode: 200,
    });
    expect(Object.keys(record).every((key) => CLOSED_FIELD_SET.includes(key as never))).toBe(true);
  });

  it("drops unexpected fields at runtime instead of logging them", () => {
    // Excess properties are a compile error on the typed signature, so the
    // forged entry crosses the type boundary the way an untyped caller or a
    // serialized payload would.
    const forged = {
      level: "info",
      requestId: "req-1",
      message: "user command text",
      body: { command: "প্রশ্নপত্র তৈরি করুন" },
    } as unknown as LogEntry;

    const record = JSON.parse(captureLog(forged)) as Record<string, unknown>;

    expect(record).not.toHaveProperty("message");
    expect(record).not.toHaveProperty("body");
    expect(record.requestId).toBe("req-1");
    expect(Object.keys(record).every((key) => CLOSED_FIELD_SET.includes(key as never))).toBe(true);
  });

  it("never exposes a raw error object in the output", () => {
    const forged = {
      level: "error",
      error: new Error("secret detail"),
      stack: "Error: secret detail",
    } as unknown as LogEntry;

    const record = JSON.parse(captureLog(forged)) as Record<string, unknown>;

    expect(record).not.toHaveProperty("error");
    expect(record).not.toHaveProperty("stack");
    expect(record).not.toHaveProperty("message");
  });
});
