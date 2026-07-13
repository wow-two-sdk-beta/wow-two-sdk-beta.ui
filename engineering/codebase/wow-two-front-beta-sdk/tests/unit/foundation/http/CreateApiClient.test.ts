/* ---------------------------------------------------------------------------
 * createApiClient tests.
 *
 * Contract: typed fetch client — JSON by default, body-driven parsing (empty
 * body → undefined and literal `null` body → null, whatever the status — no
 * 204 sniffing), a swappable ResponseEnvelope (default wowTwoEnvelope: `{ data }`
 * unwrap + RFC 7807 → ApiError; `unwrap: false` bypasses any strategy), query
 * serialization (arrays repeat the key, null/undefined skipped), FormData
 * passthrough, bearer delegate, network failure → ApiError status 0, native
 * AbortError rethrow, 401 hook, opt-in Temporal revive, and transport retry
 * OFF by default (a RetryPolicy turns it on via shouldRetry/computeRetryDelay,
 * respecting the abort signal during backoff waits). Retry/401 key off the
 * thrown error's `status` — foreign error types from a custom envelope's
 * toError never trigger them.
 * ------------------------------------------------------------------------- */

import { Temporal } from 'temporal-polyfill';
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest';

import { BackoffStrategy, type RetryContext, type RetryPolicy } from '@src/foundation/resilience';

import { ApiError } from '@src/foundation/http/ApiError';
import { createApiClient } from '@src/foundation/http/CreateApiClient';
import { rawEnvelope, type ResponseEnvelope } from '@src/foundation/http/Envelope';
import { fieldErrors } from '@src/foundation/http/FieldErrors';

type FetchMock = Mock<typeof fetch>;

/** Builds a fresh JSON Response — bodies are single-read, so never share an instance across calls. */
const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

/** A fetch mock resolving a fresh JSON response on every call. */
const fetchOk = (body: unknown, status = 200): FetchMock => vi.fn<typeof fetch>(async () => json(body, status));

const lastCall = (fetchMock: FetchMock): { url: string; init: RequestInit } => {
  const call = fetchMock.mock.lastCall;
  if (!call) throw new Error('fetch was not called');
  return { url: String(call[0]), init: call[1] ?? {} };
};

const lastHeaders = (fetchMock: FetchMock): Headers => new Headers(lastCall(fetchMock).init.headers);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('createApiClient success handling', () => {
  it('unwraps the { data } envelope by default', async () => {
    const client = createApiClient({ fetch: fetchOk({ data: { id: 1 } }) });
    await expect(client.get('/items/1')).resolves.toEqual({ id: 1 });
  });

  it('returns the raw parsed body with unwrap: false', async () => {
    const client = createApiClient({ fetch: fetchOk({ data: { id: 1 }, meta: { page: 2 } }) });
    await expect(client.get('/items/1', { unwrap: false })).resolves.toEqual({ data: { id: 1 }, meta: { page: 2 } });
  });

  it('passes a non-{ data } object body through unchanged (shape-checked unwrap)', async () => {
    const client = createApiClient({ fetch: fetchOk({ id: 1 }) });
    await expect(client.get('/items/1')).resolves.toEqual({ id: 1 });
  });

  it('uses the global fetch when none is injected', async () => {
    vi.stubGlobal('fetch', fetchOk({ data: 'global' }));
    await expect(createApiClient().get('/items')).resolves.toBe('global');
  });
});

describe('createApiClient body-driven parsing', () => {
  /** Builds a Response-like stub — the constructor rejects bodies on null-body statuses (204), which real proxies still send. */
  const stubResponse = (body: string, status: number): Response =>
    ({ ok: status >= 200 && status < 300, status, statusText: '', text: async () => body }) as unknown as Response;

  const empties: ReadonlyArray<[desc: string, status: number]> = [
    ['an empty 200 body resolves undefined', 200],
    ['an empty 204 body resolves undefined', 204],
  ];

  it.each(empties)('%s', async (_desc, status) => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status }));
    await expect(createApiClient({ fetch: fetchMock }).get('/items/1')).resolves.toBeUndefined();
  });

  it('a literal null body resolves null — the caller sees what the wire said', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('null', { status: 200 }));
    await expect(createApiClient({ fetch: fetchMock }).get('/items/1')).resolves.toBeNull();
  });

  it('a literal null body resolves null with unwrap: false too', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('null', { status: 200 }));
    await expect(createApiClient({ fetch: fetchMock }).get('/items/1', { unwrap: false })).resolves.toBeNull();
  });

  it('a 204 WITH a body parses per the envelope — body-driven, not status-driven', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => stubResponse('{"data":"v"}', 204));
    await expect(createApiClient({ fetch: fetchMock }).delete<string>('/items/1')).resolves.toBe('v');
  });

  it('revives Temporal fields on a bodied 204 like any other body', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => stubResponse('{"data":{"at":"2026-07-04T12:00:00Z"}}', 204));
    const result = await createApiClient({ fetch: fetchMock, reviveTemporal: true }).delete<{ at: unknown }>('/x');
    expect(result.at).toBeInstanceOf(Temporal.Instant);
  });
});

describe('createApiClient temporal revive', () => {
  const wire = { data: { at: '2026-07-04T12:00:00Z', day: '2026-07-04', name: 'x' } };

  it('revives ISO date fields to Temporal.* when opted in', async () => {
    const client = createApiClient({ fetch: fetchOk(wire), reviveTemporal: true });
    const result = await client.get<{ at: unknown; day: unknown; name: unknown }>('/items');
    expect(result.at).toBeInstanceOf(Temporal.Instant);
    expect(result.day).toBeInstanceOf(Temporal.PlainDate);
    expect(result.name).toBe('x');
  });

  it('leaves ISO date fields as strings by default', async () => {
    const client = createApiClient({ fetch: fetchOk(wire) });
    const result = await client.get<{ at: unknown; day: unknown }>('/items');
    expect(result.at).toBe('2026-07-04T12:00:00Z');
    expect(result.day).toBe('2026-07-04');
  });
});

describe('createApiClient request building', () => {
  const verbs = [
    ['get', 'GET'],
    ['post', 'POST'],
    ['put', 'PUT'],
    ['patch', 'PATCH'],
    ['delete', 'DELETE'],
  ] as const;

  it.each(verbs)('%s sends %s', async (verb, method) => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock })[verb]('/x');
    expect(lastCall(fetchMock).init.method).toBe(method);
  });

  it('request defaults to GET and honors init.method as the escape hatch', async () => {
    const fetchMock = fetchOk({ data: null });
    const client = createApiClient({ fetch: fetchMock });
    await client.request('/x');
    expect(lastCall(fetchMock).init.method).toBe('GET');
    await client.request('/x', { method: 'HEAD' });
    expect(lastCall(fetchMock).init.method).toBe('HEAD');
  });

  it('prefixes baseUrl and defaults to same-origin without one', async () => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock, baseUrl: 'https://api.test' }).get('/v1/items');
    expect(lastCall(fetchMock).url).toBe('https://api.test/v1/items');
    await createApiClient({ fetch: fetchMock }).get('/v1/items');
    expect(lastCall(fetchMock).url).toBe('/v1/items');
  });

  it('JSON-stringifies the body and sets the JSON headers', async () => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock }).post('/items', { body: { name: 'a' } });
    expect(lastCall(fetchMock).init.body).toBe('{"name":"a"}');
    expect(lastHeaders(fetchMock).get('Content-Type')).toBe('application/json');
    expect(lastHeaders(fetchMock).get('Accept')).toBe('application/json');
  });

  it('passes FormData through untouched without a Content-Type', async () => {
    const fetchMock = fetchOk({ data: null });
    const form = new FormData();
    form.append('file', 'x');
    await createApiClient({ fetch: fetchMock }).post('/upload', { body: form });
    expect(lastCall(fetchMock).init.body).toBe(form);
    expect(lastHeaders(fetchMock).get('Content-Type')).toBeNull();
  });

  it('sends no body and no Content-Type when the body is absent', async () => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock }).get('/items');
    expect('body' in lastCall(fetchMock).init).toBe(false);
    expect(lastHeaders(fetchMock).get('Content-Type')).toBeNull();
  });

  it('applies defaultHeaders and credentials, and lets per-request headers win', async () => {
    const fetchMock = fetchOk({ data: null });
    const client = createApiClient({
      fetch: fetchMock,
      credentials: 'include',
      defaultHeaders: { 'X-Api-Version': '1', 'X-Traced': 'no' },
    });
    await client.get('/items', { headers: { 'X-Traced': 'yes' } });
    expect(lastCall(fetchMock).init.credentials).toBe('include');
    expect(lastHeaders(fetchMock).get('X-Api-Version')).toBe('1');
    expect(lastHeaders(fetchMock).get('X-Traced')).toBe('yes');
  });
});

describe('createApiClient query serialization', () => {
  const cases: ReadonlyArray<[desc: string, query: Record<string, unknown>, expected: string]> = [
    ['scalars append as key=value', { a: 1, b: 'x', c: true }, '/items?a=1&b=x&c=true'],
    ['arrays repeat the key', { tag: ['a', 'b'], page: 2 }, '/items?tag=a&tag=b&page=2'],
    ['null and undefined entries are skipped', { a: null, b: undefined, c: 1 }, '/items?c=1'],
    ['null items inside arrays are skipped', { a: [1, null, undefined, 2] }, '/items?a=1&a=2'],
    ['all-skipped query leaves the path bare', { a: null }, '/items'],
    ['empty query object leaves the path bare', {}, '/items'],
    ['reserved characters are encoded', { q: 'a b&c' }, '/items?q=a+b%26c'],
  ];

  it.each(cases)('%s', async (_desc, query, expected) => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock }).get('/items', { query });
    expect(lastCall(fetchMock).url).toBe(expected);
  });

  it('appends with & when the path already has a query string', async () => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock }).get('/items?page=1', { query: { q: 'x' } });
    expect(lastCall(fetchMock).url).toBe('/items?page=1&q=x');
  });
});

describe('createApiClient bearer delegate', () => {
  const cases: ReadonlyArray<
    [desc: string, getAuthToken: () => string | null | Promise<string | null>, expected: string | null]
  > = [
    ['sync token sets the Authorization header', () => 'sync-token', 'Bearer sync-token'],
    ['async token sets the Authorization header', async () => 'async-token', 'Bearer async-token'],
    ['null token skips the header', () => null, null],
    ['async null token skips the header', async () => null, null],
  ];

  it.each(cases)('%s', async (_desc, getAuthToken, expected) => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock, getAuthToken }).get('/me');
    expect(lastHeaders(fetchMock).get('Authorization')).toBe(expected);
  });

  it('omits the header entirely without a delegate', async () => {
    const fetchMock = fetchOk({ data: null });
    await createApiClient({ fetch: fetchMock }).get('/me');
    expect(lastHeaders(fetchMock).get('Authorization')).toBeNull();
  });
});

describe('createApiClient error handling', () => {
  const problem = {
    type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
    title: 'Validation failed',
    status: 400,
    detail: 'One or more validation errors occurred.',
    errors: { name: ['Required'], email: ['Invalid', 'Taken'] },
  };

  it('throws ApiError carrying the status and parsed ProblemDetails on non-2xx', async () => {
    const client = createApiClient({ fetch: fetchOk(problem, 400) });
    const error = (await client.post('/items').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.problem).toEqual(problem);
    expect(error.message).toBe('Validation failed'); // ApiError precedence: title first
    expect(fieldErrors(error)).toEqual({ name: ['Required'], email: ['Invalid', 'Taken'] });
  });

  it('throws ApiError with a null problem on a non-JSON error body', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response('<html>bad gateway</html>', { status: 502 }));
    const error = (await createApiClient({ fetch: fetchMock }).get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.problem).toBeNull();
    expect(error.message).toBe('Request failed with status 502');
  });

  it('wraps a network failure as ApiError status 0', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    });
    const error = (await createApiClient({ fetch: fetchMock }).get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.problem).toBeNull();
    expect(error.message).toBe('fetch failed');
  });

  it('rethrows the native AbortError untouched — never an ApiError', async () => {
    const abort = new DOMException('The operation was aborted.', 'AbortError');
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw abort;
    });
    const controller = new AbortController();
    const error: unknown = await createApiClient({ fetch: fetchMock })
      .get('/x', { signal: controller.signal })
      .catch((e: unknown) => e);
    expect(error).toBe(abort); // the same instance — not wrapped
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe('AbortError');
  });

  it('fires onUnauthorized with the built ApiError on 401 and still throws it', async () => {
    const onUnauthorized = vi.fn<(error: ApiError) => void>();
    const client = createApiClient({ fetch: fetchOk({ title: 'Unauthorized' }, 401), onUnauthorized });
    const error = (await client.get('/me').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledWith(error); // the thrown instance
  });

  it('does not fire onUnauthorized on other failures', async () => {
    const onUnauthorized = vi.fn<(error: ApiError) => void>();
    await createApiClient({ fetch: fetchOk({}, 500), onUnauthorized })
      .get('/x')
      .catch(() => undefined);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});

describe('createApiClient envelope strategy', () => {
  const policy: RetryPolicy = { maxRetries: 2, backoff: BackoffStrategy.Constant, baseDelayMs: 100 };

  /** A foreign contract: `{ result }` success bodies; non-2xx throws a plain (non-ApiError) Error. */
  const resultEnvelope: ResponseEnvelope = {
    unwrap: (parsed) => (parsed as { result: unknown }).result,
    toError: (parsed, response) =>
      new Error(`upstream ${response.status}: ${(parsed as { reason?: string } | undefined)?.reason ?? 'unknown'}`),
  };

  it('a custom envelope unwraps 2xx bodies end-to-end', async () => {
    const client = createApiClient({ fetch: fetchOk({ result: { id: 7 } }), envelope: resultEnvelope });
    await expect(client.get('/items/7')).resolves.toEqual({ id: 7 });
  });

  it('a custom envelope shapes the thrown non-2xx error from the parsed body', async () => {
    const client = createApiClient({ fetch: fetchOk({ reason: 'quota' }, 429), envelope: resultEnvelope });
    const error = (await client.get('/x').catch((e: unknown) => e)) as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.message).toBe('upstream 429: quota');
  });

  it('unwrap: false bypasses the strategy — the request flag wins over the envelope', async () => {
    const unwrap = vi.fn(() => 'unwrapped');
    const client = createApiClient({ fetch: fetchOk({ result: 1 }), envelope: { ...resultEnvelope, unwrap } });
    await expect(client.get('/x', { unwrap: false })).resolves.toEqual({ result: 1 });
    expect(unwrap).not.toHaveBeenCalled();
  });

  it('a foreign toError type never retries, even with a policy', async () => {
    const fetchMock = fetchOk({ reason: 'down' }, 503);
    const client = createApiClient({ fetch: fetchMock, envelope: resultEnvelope, retry: policy });
    const error = (await client.get('/x').catch((e: unknown) => e)) as Error;
    expect(error).not.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no status to key retry off
  });

  it('a foreign toError type never fires onUnauthorized on 401', async () => {
    const onUnauthorized = vi.fn();
    const client = createApiClient({ fetch: fetchOk({ reason: 'expired' }, 401), envelope: resultEnvelope, onUnauthorized });
    await client.get('/me').catch(() => undefined);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('rawEnvelope passes the whole parsed body through', async () => {
    const client = createApiClient({ fetch: fetchOk({ data: { id: 1 }, meta: { page: 2 } }), envelope: rawEnvelope });
    await expect(client.get('/items')).resolves.toEqual({ data: { id: 1 }, meta: { page: 2 } });
  });

  it('rawEnvelope throws ApiError(status, null, statusText), keeping the 401 hook wired', async () => {
    const onUnauthorized = vi.fn<(error: ApiError) => void>();
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response('{"title":"ignored"}', { status: 401, statusText: 'Unauthorized' }),
    );
    const client = createApiClient({ fetch: fetchMock, envelope: rawEnvelope, onUnauthorized });
    const error = (await client.get('/me').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.problem).toBeNull(); // rawEnvelope ignores the body
    expect(error.message).toBe('Unauthorized');
    expect(onUnauthorized).toHaveBeenCalledWith(error);
  });

  it('rawEnvelope failures still drive retry — any ApiError-returning envelope keeps status keying', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(json({ id: 1 }));
    const pending = createApiClient({ fetch: fetchMock, envelope: rawEnvelope, retry: policy }).get('/x');
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('createApiClient retry', () => {
  const constantPolicy: RetryPolicy = { maxRetries: 2, backoff: BackoffStrategy.Constant, baseDelayMs: 100 };

  it('is OFF by default — a transient 503 makes exactly one call', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    const error = (await createApiClient({ fetch: fetchMock }).get('/x').catch((e: unknown) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries transient failures per the policy, waiting the computed backoff between attempts', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    const onRetry = vi.fn<(context: RetryContext) => void>();
    const client = createApiClient({ fetch: fetchMock, retry: { ...constantPolicy, onRetry } });

    const pending = client.get('/x').catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // waiting on the first 100ms backoff
    await vi.advanceTimersByTimeAsync(99);
    expect(fetchMock).toHaveBeenCalledTimes(1); // still waiting
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).toHaveBeenCalledTimes(3); // maxRetries 2 → 3 calls total

    const error = (await pending) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(503);
    expect(onRetry.mock.calls.map(([context]) => [context.attempt, context.status, context.delayMs])).toEqual([
      [1, 503, 100],
      [2, 503, 100],
    ]);
  });

  it('resolves when a retry succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(json({ data: 'v' }));
    const pending = createApiClient({ fetch: fetchMock, retry: constantPolicy }).get<string>('/x');
    await vi.runAllTimersAsync();
    await expect(pending).resolves.toBe('v');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('computes exponential backoff delays across retries', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 500 }));
    const onRetry = vi.fn<(context: RetryContext) => void>();
    const client = createApiClient({
      fetch: fetchMock,
      retry: { maxRetries: 3, backoff: BackoffStrategy.Exponential, baseDelayMs: 100, onRetry },
    });
    const pending = client.get('/x').catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(onRetry.mock.calls.map(([context]) => context.delayMs)).toEqual([100, 200, 400]);
  });

  it('does not retry a non-transient status even with a policy', async () => {
    const fetchMock = fetchOk({ title: 'Bad request' }, 400);
    const error = (await createApiClient({ fetch: fetchMock, retry: constantPolicy })
      .get('/x')
      .catch((e: unknown) => e)) as ApiError;
    expect(error.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a network failure (status 0) and aborting mid-wait rejects with the native AbortError', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(async () => {
      throw new TypeError('fetch failed');
    });
    const controller = new AbortController();
    const client = createApiClient({ fetch: fetchMock, retry: constantPolicy });
    const pending = client.get('/x', { signal: controller.signal }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(0); // first attempt failed → waiting on the backoff
    expect(fetchMock).toHaveBeenCalledTimes(1);
    controller.abort();
    const error = await pending;
    expect((error as Error).name).toBe('AbortError');
    expect(error).not.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1); // no further attempts after the abort
  });
});
