import { Temporal } from 'temporal-polyfill';

// Strict ISO-8601 shapes. Anchored (^…$) so partial / lenient strings never match — only a
// wire value that is unambiguously one Temporal kind is upgraded; everything else stays a string.
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const PLAIN_DATE = /^\d{4}-\d{2}-\d{2}$/;
const PLAIN_TIME = /^\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;
// ISO-8601 duration: sign, `P`, then at least one designator (lookahead rejects a bare `P`).
const DURATION = /^-?P(?=[\dT])(\d+Y)?(\d+M)?(\d+W)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/;

/**
 * Upgrades a matching ISO-8601 string to its `Temporal.*` value; returns everything else unchanged.
 * Intended as the reviver argument to `JSON.parse` so inbound date fields arrive as Temporal objects
 * (outbound is automatic via each `Temporal.*.toJSON()`). Each parse is guarded — an ISO-shaped but
 * invalid value (e.g. `2026-13-40`) falls back to the raw string rather than throwing.
 */
export function temporalReviver(_key: string, value: unknown): unknown {
  if (typeof value !== 'string') return value;

  if (INSTANT.test(value)) {
    try {
      return Temporal.Instant.from(value);
    } catch {
      return value;
    }
  }
  if (PLAIN_DATE.test(value)) {
    try {
      return Temporal.PlainDate.from(value);
    } catch {
      return value;
    }
  }
  if (PLAIN_TIME.test(value)) {
    try {
      return Temporal.PlainTime.from(value);
    } catch {
      return value;
    }
  }
  if (DURATION.test(value)) {
    try {
      return Temporal.Duration.from(value);
    } catch {
      return value;
    }
  }
  return value;
}

/** Parses a JSON string with {@link temporalReviver} applied, upgrading ISO date fields to `Temporal.*`. */
export function parseJson<T>(text: string): T {
  return JSON.parse(text, temporalReviver) as T;
}
