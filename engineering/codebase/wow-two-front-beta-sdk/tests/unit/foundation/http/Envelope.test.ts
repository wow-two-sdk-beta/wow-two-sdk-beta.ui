/* ---------------------------------------------------------------------------
 * ResponseEnvelope built-ins tests.
 *
 * Contract: wowTwoEnvelope unwraps a `{ data }`-shaped object body to its
 * `data` member and passes every other parsed body (null, arrays, scalars,
 * non-envelope objects) through unchanged; its toError takes a JSON-object
 * body as ProblemDetails (non-object → null problem) and throws ApiError with
 * the title → detail → status-fallback message precedence. rawEnvelope is the
 * identity: bodies pass through, errors are ApiError(status, null, statusText)
 * — still ApiError so status-keyed retry / onUnauthorized stay uniform.
 * ------------------------------------------------------------------------- */

import { describe, expect, it } from 'vitest';

import { ApiError } from '@src/foundation/http/ApiError';
import { rawEnvelope, wowTwoEnvelope } from '@src/foundation/http/Envelope';

const ok = new Response(null, { status: 200 });
const failed = (status: number, statusText = ''): Response => new Response(null, { status, statusText });

describe('wowTwoEnvelope unwrap', () => {
  const passthrough: ReadonlyArray<[desc: string, parsed: unknown]> = [
    ['a literal null body stays null', null],
    ['a non-envelope object passes through', { id: 1 }],
    ['an array passes through (never treated as an envelope)', [{ data: 1 }]],
    ['a string scalar passes through', 'plain'],
    ['a number scalar passes through', 5],
    ['a boolean scalar passes through', false],
  ];

  it('unwraps a { data }-shaped object to its data member', () => {
    expect(wowTwoEnvelope.unwrap({ data: { id: 1 } }, ok)).toEqual({ id: 1 });
    expect(wowTwoEnvelope.unwrap({ data: null }, ok)).toBeNull();
    expect(wowTwoEnvelope.unwrap({ data: false, meta: { page: 2 } }, ok)).toBe(false);
  });

  it.each(passthrough)('%s', (_desc, parsed) => {
    expect(wowTwoEnvelope.unwrap(parsed, ok)).toBe(parsed);
  });
});

describe('wowTwoEnvelope toError', () => {
  it('takes a JSON-object body as the ProblemDetails by reference', () => {
    const problem = { title: 'Conflict', detail: 'duplicate', traceId: 'abc' };
    const error = wowTwoEnvelope.toError(problem, failed(409)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.problem).toBe(problem);
    expect(error.message).toBe('Conflict'); // ApiError precedence: title first
  });

  it('falls back to detail, then to the status message', () => {
    expect(wowTwoEnvelope.toError({ detail: 'gone' }, failed(404)).message).toBe('gone');
    expect(wowTwoEnvelope.toError({}, failed(500)).message).toBe('Request failed with status 500');
  });

  const nonObjects: ReadonlyArray<[desc: string, parsed: unknown]> = [
    ['an array body yields a null problem', ['boom']],
    ['a scalar body yields a null problem', 'boom'],
    ['a literal null body yields a null problem', null],
    ['an empty / malformed body (undefined) yields a null problem', undefined],
  ];

  it.each(nonObjects)('%s', (_desc, parsed) => {
    const error = wowTwoEnvelope.toError(parsed, failed(502)) as ApiError;
    expect(error.problem).toBeNull();
    expect(error.status).toBe(502);
    expect(error.message).toBe('Request failed with status 502');
  });
});

describe('rawEnvelope', () => {
  it('unwrap is the identity for every body shape', () => {
    const body = { data: { id: 1 }, meta: { page: 2 } };
    expect(rawEnvelope.unwrap(body, ok)).toBe(body);
    expect(rawEnvelope.unwrap(null, ok)).toBeNull();
    expect(rawEnvelope.unwrap('plain', ok)).toBe('plain');
  });

  it('toError throws ApiError(status, null, statusText), ignoring the body', () => {
    const error = rawEnvelope.toError({ title: 'ignored' }, failed(404, 'Not Found')) as ApiError;
    expect(error).toBeInstanceOf(ApiError); // deliberate: uniform status access for retry / 401 / instanceof
    expect(error.status).toBe(404);
    expect(error.problem).toBeNull();
    expect(error.message).toBe('Not Found');
  });

  it('toError falls back to the status message when statusText is empty (HTTP/2)', () => {
    expect(rawEnvelope.toError(undefined, failed(500)).message).toBe('Request failed with status 500');
  });
});
