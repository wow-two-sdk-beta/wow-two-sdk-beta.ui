/* ---------------------------------------------------------------------------
 * ApiError tests.
 *
 * Contract: a typed transport error carrying the HTTP status and the parsed
 * RFC 7807 problem body. Message precedence: explicit message → problem.title
 * → problem.detail → "Request failed with status N". Prototype chain is
 * restored so `instanceof` survives transpiled targets.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';

import { ApiError } from './ApiError';
import type { ProblemDetails } from './ProblemDetails';

describe('ApiError message precedence', () => {
  const cases: ReadonlyArray<
    [desc: string, status: number, problem: ProblemDetails | null, message: string | undefined, expected: string]
  > = [
    ['explicit message beats title and detail', 500, { title: 'T', detail: 'D' }, 'boom', 'boom'],
    ['title when no explicit message', 404, { title: 'Not Found', detail: 'gone' }, undefined, 'Not Found'],
    ['detail when no title', 400, { detail: 'field is required' }, undefined, 'field is required'],
    ['status fallback when problem is empty', 500, {}, undefined, 'Request failed with status 500'],
    ['status fallback when problem is null', 503, null, undefined, 'Request failed with status 503'],
    ['status fallback for network status 0', 0, null, undefined, 'Request failed with status 0'],
  ];

  it.each(cases)('%s', (_desc, status, problem, message, expected) => {
    expect(new ApiError(status, problem, message).message).toBe(expected);
  });
});

describe('ApiError shape', () => {
  it('exposes the status and the problem body by reference', () => {
    const problem: ProblemDetails = { title: 'Conflict', status: 409, traceId: 'abc-123' };
    const error = new ApiError(409, problem);
    expect(error.status).toBe(409);
    expect(error.problem).toBe(problem);
    // Extension members (index signature) survive untouched.
    expect(error.problem?.traceId).toBe('abc-123');
  });

  it('is named ApiError', () => {
    expect(new ApiError(500, null).name).toBe('ApiError');
  });

  it('passes instanceof for both ApiError and Error (restored prototype chain)', () => {
    const error: unknown = new ApiError(500, null);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toBeInstanceOf(Error);
  });

  it('carries a stack like a regular Error', () => {
    expect(new ApiError(500, null).stack).toBeTruthy();
  });
});
