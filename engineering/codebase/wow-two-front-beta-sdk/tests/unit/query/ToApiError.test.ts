import { describe, it, expect } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { toApiError } from '@src/query/ToApiError';

describe('toApiError', () => {
  it('passes an ApiError through untouched — same instance, no rewrap', () => {
    const original = new ApiError(503, null, 'down');

    expect(toApiError(original)).toBe(original);
  });

  it('wraps a plain Error as status 0, keeping the message', () => {
    const coerced = toApiError(new Error('socket hangup'));

    expect(coerced).toBeInstanceOf(ApiError);
    expect(coerced.status).toBe(0);
    expect(coerced.problem).toBeNull();
    expect(coerced.message).toBe('socket hangup');
  });

  it('wraps a string rejection as status 0 with the string as message', () => {
    const coerced = toApiError('nope');

    expect(coerced.status).toBe(0);
    expect(coerced.message).toBe('nope');
  });

  it('wraps any other value as status 0 / Unknown error', () => {
    expect(toApiError({ odd: true }).message).toBe('Unknown error');
    expect(toApiError(undefined).message).toBe('Unknown error');
    expect(toApiError(42).message).toBe('Unknown error');
  });

  it('coerces an AbortError like any Error — cancellation handling lives at the client seam, not here', () => {
    // `createQueryClient` filters cancellations BEFORE coercion (no retry, no onError); by the time
    // toApiError runs on anything else, an abort is just a failed request from the caller's view.
    const abort = Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' });

    const coerced = toApiError(abort);

    expect(coerced).toBeInstanceOf(ApiError);
    expect(coerced.status).toBe(0);
  });
});
