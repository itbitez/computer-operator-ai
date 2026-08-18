// Invariant 4: logs are metadata-only. The closed field set below is the entire
// vocabulary — there is deliberately no `message` field, because a free-form message
// is how command text, document content, or a request body ends up in the log.
// Excess property checking rejects anything outside this set at compile time.
export type LogLevel = "info" | "warn" | "error";

export interface LogFields {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly method?: string;
  readonly path?: string;
  readonly statusCode?: number;
  readonly durationMs?: number;
  readonly userId?: string;
  readonly requestId?: string;
  readonly entityType?: string;
  readonly entityId?: string;
  readonly errorCode?: string;
  readonly errorName?: string;
}

export type LogEntry = Omit<LogFields, "timestamp">;

export function log(entry: LogEntry): void {
  const record: LogFields = {
    timestamp: new Date().toISOString(),
    level: entry.level,
    method: entry.method,
    path: entry.path,
    statusCode: entry.statusCode,
    durationMs: entry.durationMs,
    userId: entry.userId,
    requestId: entry.requestId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    errorCode: entry.errorCode,
    errorName: entry.errorName,
  };
  console.log(JSON.stringify(record));
}
