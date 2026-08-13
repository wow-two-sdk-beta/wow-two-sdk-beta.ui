import { ApiError } from './ApiError';
import type { ProblemDetails } from './ProblemDetails';

/** Checks whether a parsed body is a plain JSON object — not `null`, not an array — the only shape that can carry an envelope or a problem. */
const isJsonObject = (parsed: unknown): parsed is Record<string, unknown> =>
  parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);

/**
 * Defines the wire-contract strategy for `createApiClient` — how a parsed 2xx body yields the payload
 * and how a parsed non-2xx body yields the thrown error. The client core stays contract-free: it reads
 * and parses the body (an empty body resolves `undefined` before any strategy runs; a network failure
 * throws a core {@link ApiError} status `0` — there is no response to delegate) and hands the rest here.
 */
export interface ResponseEnvelope {
  /** Extracts the payload from a parsed 2xx body. Skipped when the request passes `unwrap: false` — the request flag wins over the strategy. */
  readonly unwrap: (parsed: unknown, response: Response) => unknown;

  /**
   * Builds the error thrown for a non-2xx response from its parsed body (plain JSON, no Temporal
   * revive; `undefined` when empty or malformed). Return an {@link ApiError} to keep retry and
   * `onUnauthorized` working — both key off the thrown error's `status` — a foreign `Error` type
   * simply never triggers them.
   */
  readonly toError: (parsed: unknown, response: Response) => Error;
}

/**
 * Provides the wow-two wire contract (the default): a 2xx object body shaped `{ data }` (`ApiResponse`)
 * unwraps to its `data` member — anything else, including a literal `null` body, passes through
 * unchanged — and a non-2xx JSON-object body is taken as the RFC 7807 {@link ProblemDetails} (non-object
 * bodies → `null` problem), thrown as {@link ApiError} with its message precedence: title → detail →
 * status fallback.
 */
export const wowTwoEnvelope: ResponseEnvelope = {
  unwrap: (parsed) => (isJsonObject(parsed) && 'data' in parsed ? parsed['data'] : parsed),
  toError: (parsed, response) => new ApiError(response.status, isJsonObject(parsed) ? (parsed as ProblemDetails) : null),
};

/**
 * Provides the identity contract for un-enveloped APIs: 2xx bodies pass through unchanged, and a
 * non-2xx response throws `ApiError(status, null, statusText)` — deliberately still an {@link ApiError}
 * rather than a plain `Error`, so `status`-keyed retry, `onUnauthorized`, and caller `instanceof`
 * handling stay uniform across envelopes. The error body is ignored (no contract to read a problem
 * from); an empty `statusText` (HTTP/2 sends none) falls back to `Request failed with status N`.
 */
export const rawEnvelope: ResponseEnvelope = {
  unwrap: (parsed) => parsed,
  toError: (_parsed, response) => new ApiError(response.status, null, response.statusText || undefined),
};
