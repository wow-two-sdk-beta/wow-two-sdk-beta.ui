import { getErrorMessage, isAbortError } from '../errors';
import { computeRetryDelay, shouldRetry, type RetryPolicy } from '../resilience';

import { ApiError } from './ApiError';
import { wowTwoEnvelope, type ResponseEnvelope } from './Envelope';
import { parseJson } from './temporalReviver';

const JsonMime = 'application/json';

/** Defines query params appended to a request path — arrays repeat the key; `null`/`undefined` entries are skipped; everything else is `String()`-ed. */
export type ApiQueryParams = Record<string, unknown>;

/** Defines the per-request init accepted by every {@link ApiClient} method. */
export interface ApiRequestInit {
  /** The query params appended to the path (see {@link ApiQueryParams}); merged onto any query string already in the path. */
  readonly query?: ApiQueryParams;

  /** The request body — JSON-stringified with `Content-Type: application/json`, except `FormData`, which passes through untouched (the runtime sets the multipart boundary). */
  readonly body?: unknown;

  /** Aborts the request (and any retry wait) — an abort rethrows the native `AbortError`, never an {@link ApiError}. */
  readonly signal?: AbortSignal | null;

  /** Extra headers merged last — they win over the computed JSON headers, the client defaults, and the bearer token. */
  readonly headers?: HeadersInit;

  /** Whether to run the envelope's unwrap on the parsed body. Default `true`; `false` returns the body exactly as parsed — the request flag wins over {@link ApiClientOptions.envelope}. */
  readonly unwrap?: boolean;

  /** The HTTP method for the `request` escape hatch. Default `GET`. The verb helpers force their own method. */
  readonly method?: string;
}

/** Defines the options for {@link createApiClient}. */
export interface ApiClientOptions {
  /** The prefix for every request path. Default `''` (same-origin — the SPA is served by the API host). */
  readonly baseUrl?: string;

  /** Supplies the bearer token, re-read on every attempt — return `null` to skip the `Authorization` header (signed-out / cookie mode). */
  readonly getAuthToken?: () => string | null | Promise<string | null>;

  /** The fetch credentials mode — `'include'` for cross-origin cookie auth; omit for the runtime default. */
  readonly credentials?: RequestCredentials;

  /** Fires on a 401 after the {@link ApiError} is built (which is still thrown) — wire session-expiry handling here. */
  readonly onUnauthorized?: (error: ApiError) => void;

  /** Headers applied to every request; per-request headers win. */
  readonly defaultHeaders?: HeadersInit;

  /** Whether to parse response bodies through the Temporal reviver so ISO date fields arrive as `Temporal.*`. Default `false`. */
  readonly reviveTemporal?: boolean;

  /** The wire-contract strategy — how 2xx bodies unwrap and how non-2xx bodies become thrown errors. Default {@link wowTwoEnvelope} (zero-config for wow-two APIs); use `rawEnvelope` for un-enveloped APIs, or supply your own. */
  readonly envelope?: ResponseEnvelope;

  /** The transport-level retry policy for transient failures. Default `false` (off) — leave off under `/query`, which owns retries, or requests double-retry. */
  readonly retry?: RetryPolicy | false;

  /** The fetch implementation, resolved per request. Default the global `fetch` — injectable for tests. */
  readonly fetch?: typeof globalThis.fetch;
}

/** Defines the typed HTTP client returned by {@link createApiClient}. */
export interface ApiClient {
  /** Sends a GET request. */
  get<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;

  /** Sends a POST request. */
  post<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;

  /** Sends a PUT request. */
  put<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;

  /** Sends a PATCH request. */
  patch<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;

  /** Sends a DELETE request. */
  delete<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;

  /** Sends a request with an arbitrary method (`init.method`, default `GET`) — the escape hatch under the verb helpers. */
  request<T = unknown>(path: string, init?: ApiRequestInit): Promise<T>;
}

/** Serializes query params — arrays repeat the key, `null`/`undefined` entries are skipped. */
function buildQueryString(query: ApiQueryParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) params.append(key, String(item));
    }
  }
  return params.toString();
}

/** Waits `ms` before a retry attempt, rejecting with the signal's native abort reason if aborted mid-wait. */
function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortReason = (): unknown => signal?.reason ?? new DOMException('The operation was aborted.', 'AbortError');
    if (signal?.aborted) {
      reject(abortReason());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(abortReason());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/** Reads a non-2xx body as plain JSON for the envelope's `toError` — empty, unreadable, or malformed bodies yield `undefined`. */
async function readErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text === '' ? undefined : (JSON.parse(text) as unknown);
  } catch {
    return undefined;
  }
}

/**
 * Creates the typed fetch client every wow-two frontend talks through — JSON by default, a swappable
 * wire contract ({@link ApiClientOptions.envelope}, default {@link wowTwoEnvelope}: `{ data }` unwrap +
 * ProblemDetails → {@link ApiError}), body-driven empties (an empty body resolves `undefined` and a
 * literal `null` body resolves `null`, whatever the status), bearer/cookie auth, optional Temporal
 * revive, and opt-in transport retry (network failure → {@link ApiError} status `0`, envelope-independent).
 * Aborts rethrow the native `AbortError` so `/query` cancellation semantics stay intact.
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const {
    baseUrl = '',
    getAuthToken,
    credentials,
    onUnauthorized,
    defaultHeaders,
    reviveTemporal = false,
    envelope = wowTwoEnvelope,
    retry = false,
  } = options;

  /** Builds the attempt's headers — JSON base → client defaults → bearer token → per-request (last wins). */
  const buildHeaders = async (init: ApiRequestInit, hasJsonBody: boolean): Promise<Headers> => {
    const headers = new Headers({ Accept: JsonMime });
    if (hasJsonBody) headers.set('Content-Type', JsonMime);
    if (defaultHeaders) new Headers(defaultHeaders).forEach((value, key) => headers.set(key, value));
    const token = getAuthToken ? await getAuthToken() : null;
    if (token != null) headers.set('Authorization', `Bearer ${token}`);
    if (init.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    return headers;
  };

  /** Performs one attempt — throws `ApiError` for transport failures, rethrows aborts natively. */
  const attempt = async <T>(url: string, init: ApiRequestInit, body: BodyInit | undefined, hasJsonBody: boolean): Promise<T> => {
    // Outside the try: a token-delegate crash is a programmer error, not a transport failure.
    const headers = await buildHeaders(init, hasJsonBody);
    const doFetch = options.fetch ?? globalThis.fetch;

    let response: Response;
    try {
      response = await doFetch(url, {
        method: init.method ?? 'GET',
        headers,
        // `?? null` lets callers pass an optional signal directly under exactOptionalPropertyTypes.
        signal: init.signal ?? null,
        ...(credentials !== undefined ? { credentials } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      throw new ApiError(0, null, getErrorMessage(error, 'Network request failed'));
    }

    if (!response.ok) throw envelope.toError(await readErrorBody(response), response);

    // Body-driven, not status-driven: no 204 / Content-Length sniffing. An empty body (any
    // status) resolves `undefined`; a literal `null` JSON body parses — and returns — as `null`.
    const text = await response.text();
    if (text === '') return undefined as T;

    const parsed: unknown = reviveTemporal ? parseJson<unknown>(text) : (JSON.parse(text) as unknown);
    if (init.unwrap === false) return parsed as T;
    return envelope.unwrap(parsed, response) as T;
  };

  const request = async <T = unknown>(path: string, init: ApiRequestInit = {}): Promise<T> => {
    const queryString = init.query ? buildQueryString(init.query) : '';
    const url = `${baseUrl}${path}${queryString ? (path.includes('?') ? '&' : '?') + queryString : ''}`;
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    const body: BodyInit | undefined =
      init.body === undefined ? undefined : isFormData ? (init.body as FormData) : JSON.stringify(init.body);

    let retries = 0;
    let previousDelayMs = 0;
    for (;;) {
      try {
        return await attempt<T>(url, init, body, init.body !== undefined && !isFormData);
      } catch (error) {
        // Only ApiErrors drive retry/401 — aborts, token-delegate crashes, malformed-JSON parse
        // errors, and foreign error types from a custom envelope's `toError` all pass through
        // natively (the `/query` layer coerces whatever it catches).
        if (!(error instanceof ApiError)) throw error;
        if (retry !== false && shouldRetry(retry, retries, error.status)) {
          const attemptNumber = retries + 1;
          const delayMs = computeRetryDelay(retry, attemptNumber, previousDelayMs);
          retry.onRetry?.({ attempt: attemptNumber, error, status: error.status, delayMs });
          await wait(delayMs, init.signal);
          previousDelayMs = delayMs;
          retries = attemptNumber;
          continue;
        }
        if (error.status === 401) onUnauthorized?.(error);
        throw error;
      }
    }
  };

  return {
    request,
    get: <T = unknown>(path: string, init?: ApiRequestInit): Promise<T> => request<T>(path, { ...init, method: 'GET' }),
    post: <T = unknown>(path: string, init?: ApiRequestInit): Promise<T> => request<T>(path, { ...init, method: 'POST' }),
    put: <T = unknown>(path: string, init?: ApiRequestInit): Promise<T> => request<T>(path, { ...init, method: 'PUT' }),
    patch: <T = unknown>(path: string, init?: ApiRequestInit): Promise<T> => request<T>(path, { ...init, method: 'PATCH' }),
    delete: <T = unknown>(path: string, init?: ApiRequestInit): Promise<T> => request<T>(path, { ...init, method: 'DELETE' }),
  };
}
