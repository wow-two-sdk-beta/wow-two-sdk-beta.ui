import { isAbortError, isTimeoutError } from '../errors';
import { computeRetryDelay, shouldRetry, type RetryPolicy } from '../resilience';
import { ResultExtensions, type Result } from '../results';
import { ApiError } from './ApiError';
import type { ApiJsonCodec } from './ApiJsonCodec';
import { ApiFailureFactory, type ApiFailure } from './ApiFailure';
import { wowTwoEnvelope, type ResponseEnvelope } from './Envelope';

export type ApiQueryParams = Record<string, unknown>;
export type ApiDecoder<T> = (value: unknown) => Result<T, ApiFailure>;
export interface ApiRequestInit {
  readonly query?: ApiQueryParams;
  readonly body?: unknown;
  readonly signal?: AbortSignal | null;
  readonly headers?: HeadersInit;
  readonly unwrap?: boolean;
  readonly method?: string;
}
export interface ApiEmptyRequestInit extends ApiRequestInit {
  readonly response: 'empty';
}
export interface ApiJsonRequestInit<T> extends ApiRequestInit {
  readonly response?: 'json';
  readonly decode: ApiDecoder<T>;
}
export interface ApiClientOptions {
  readonly baseUrl?: string;
  readonly getAuthToken?: () => string | null | Promise<string | null>;
  readonly credentials?: RequestCredentials;
  readonly onUnauthorized?: (failure: ApiFailure) => void;
  readonly defaultHeaders?: HeadersInit;
  readonly envelope?: ResponseEnvelope;
  readonly retry?: RetryPolicy | false;
  readonly fetch?: typeof globalThis.fetch;
  /** Overrides request/response JSON conversion, including non-success diagnostics. Native JSON is the default. */
  readonly json?: ApiJsonCodec;
}
/** Typed payloads require a decoder; an empty response must be requested explicitly. */
export interface ApiMethod {
  (path: string, init: ApiEmptyRequestInit): Promise<Result<void, ApiFailure>>;
  <T>(path: string, init: ApiJsonRequestInit<T>): Promise<Result<T, ApiFailure>>;
  (path: string, init?: ApiRequestInit): Promise<Result<unknown, ApiFailure>>;
}
export interface ApiClient {
  readonly get: ApiMethod;
  readonly post: ApiMethod;
  readonly put: ApiMethod;
  readonly patch: ApiMethod;
  readonly delete: ApiMethod;
  readonly request: ApiMethod;
}
interface RequestOptions extends ApiRequestInit {
  readonly response?: 'json' | 'empty';
  readonly decode?: ApiDecoder<unknown>;
}
function buildQueryString(query: ApiQueryParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item != null) params.append(key, String(item));
    }
  }
  return params.toString();
}
function interruption(signal?: AbortSignal | null, error?: unknown): ApiFailure | undefined {
  if (isTimeoutError(error) || (signal?.aborted && isTimeoutError(signal.reason)))
    return ApiFailureFactory.create('timeout');
  if (signal?.aborted || isAbortError(error)) return ApiFailureFactory.create('cancelled');
  return undefined;
}
/** Wakes immediately on cancellation; the request loop returns its typed outcome. */
function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const finish = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal?.addEventListener('abort', finish, { once: true });
  });
}
/** Returns expected transport/protocol failures; application decoder bugs still throw. */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const { baseUrl = '', getAuthToken, credentials, defaultHeaders, envelope = wowTwoEnvelope, retry = false } = options;
  const attempt = async (
    url: string,
    init: RequestOptions,
    body: BodyInit | undefined,
    hasJsonBody: boolean,
  ): Promise<Result<unknown, ApiFailure>> => {
    const cancelled = interruption(init.signal);
    if (cancelled) return ResultExtensions.fail(cancelled);
    const headers = new Headers({ Accept: 'application/json' });
    if (hasJsonBody) headers.set('Content-Type', 'application/json');
    if (defaultHeaders) new Headers(defaultHeaders).forEach((value, key) => headers.set(key, value));
    const token = getAuthToken ? await getAuthToken() : null;
    if (token != null) headers.set('Authorization', `Bearer ${token}`);
    if (init.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    let response: Response;
    try {
      response = await (options.fetch ?? globalThis.fetch)(url, {
        method: init.method ?? 'GET',
        headers,
        signal: init.signal ?? null,
        ...(credentials !== undefined ? { credentials } : {}),
        ...(body !== undefined ? { body } : {}),
      });
    } catch (error) {
      return ResultExtensions.fail(interruption(init.signal, error) ?? ApiFailureFactory.create('transport'));
    }
    let text: string;
    try {
      text = await response.text();
    } catch (error) {
      return ResultExtensions.fail(interruption(init.signal, error) ?? ApiFailureFactory.create('transport', response));
    }
    const aborted = interruption(init.signal);
    if (aborted) return ResultExtensions.fail(aborted);
    if (!response.ok) {
      let diagnostics: unknown;
      if (text !== '' && options.json) {
        const decoded = options.json.parse(text);
        const interrupted = interruption(init.signal);
        if (interrupted) return ResultExtensions.fail(interrupted);
        if (!decoded.ok) return ResultExtensions.fail(ApiFailureFactory.create('protocol', response));
        diagnostics = decoded.value;
      } else {
        try {
          diagnostics = text === '' ? undefined : JSON.parse(text);
        } catch {
          diagnostics = undefined;
        }
      }
      return ResultExtensions.fail(envelope.toFailure(diagnostics, response));
    }
    if (init.response === 'empty')
      return text === ''
        ? ResultExtensions.ok(undefined)
        : ResultExtensions.fail(ApiFailureFactory.create('protocol', response));
    if (text === '' || !/^application\/(?:[\w.-]+\+)?json(?:;|$)/i.test(response.headers.get('Content-Type') ?? '')) {
      return ResultExtensions.fail(ApiFailureFactory.create('protocol', response));
    }
    let parsed: unknown;
    if (options.json) {
      const decoded = options.json.parse(text);
      const interrupted = interruption(init.signal);
      if (interrupted) return ResultExtensions.fail(interrupted);
      if (!decoded.ok) return ResultExtensions.fail(ApiFailureFactory.create('protocol', response));
      parsed = decoded.value;
    } else {
      try {
        parsed = JSON.parse(text);
      } catch {
        return ResultExtensions.fail(ApiFailureFactory.create('protocol', response));
      }
    }
    const payload = init.unwrap === false ? ResultExtensions.ok(parsed) : envelope.unwrap(parsed, response);
    if (!payload.ok) return payload;
    return init.decode ? init.decode(payload.value) : payload;
  };
  const execute = async (path: string, init: RequestOptions): Promise<Result<unknown, ApiFailure>> => {
    const cancelled = interruption(init.signal);
    if (cancelled) return ResultExtensions.fail(cancelled);
    const query = init.query ? buildQueryString(init.query) : '';
    const url = `${baseUrl}${path}${query ? (path.includes('?') ? '&' : '?') + query : ''}`;
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    let body: BodyInit | undefined;
    if (init.body !== undefined && !isFormData && options.json) {
      const encoded = options.json.stringify(init.body);
      const interrupted = interruption(init.signal);
      if (interrupted) return ResultExtensions.fail(interrupted);
      if (!encoded.ok) return ResultExtensions.fail(ApiFailureFactory.create('validation'));
      body = encoded.value;
    } else {
      body = init.body === undefined ? undefined : isFormData ? (init.body as FormData) : JSON.stringify(init.body);
    }
    let retries = 0;
    let previousDelayMs = 0;
    for (;;) {
      const result = await attempt(url, init, body, init.body !== undefined && !isFormData);
      if (result.ok) return result;
      const failure = result.failure;
      const retryable = failure.code === 'http' || failure.code === 'transport';
      const idempotent = ['GET', 'HEAD', 'OPTIONS'].includes((init.method ?? 'GET').toUpperCase());
      if (retry !== false && retryable && idempotent && shouldRetry(retry, retries, failure.status)) {
        const attemptNumber = retries + 1;
        const delayMs = computeRetryDelay(retry, attemptNumber, previousDelayMs);
        retry.onRetry?.({ attempt: attemptNumber, error: new ApiError(failure), status: failure.status, delayMs });
        await wait(delayMs, init.signal);
        retries = attemptNumber;
        previousDelayMs = delayMs;
        continue;
      }
      if (failure.status === 401) options.onUnauthorized?.(failure);
      return result;
    }
  };
  const method = (verb?: string): ApiMethod => {
    function send(path: string, init: ApiEmptyRequestInit): Promise<Result<void, ApiFailure>>;
    function send<T>(path: string, init: ApiJsonRequestInit<T>): Promise<Result<T, ApiFailure>>;
    function send(path: string, init?: ApiRequestInit): Promise<Result<unknown, ApiFailure>>;
    function send(path: string, init: RequestOptions = {}): Promise<Result<unknown, ApiFailure>> {
      return execute(path, verb ? { ...init, method: verb } : init);
    }
    return send;
  };
  return {
    request: method(),
    get: method('GET'),
    post: method('POST'),
    put: method('PUT'),
    patch: method('PATCH'),
    delete: method('DELETE'),
  };
}
