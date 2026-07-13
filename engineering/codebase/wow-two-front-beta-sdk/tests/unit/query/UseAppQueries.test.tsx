import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ApiError } from '@src/foundation/http';

import { useAppQueries } from '@src/query/UseAppQueries';
import { createQueryWrapper } from '@src/query/QueryTestUtils';

/** A promise plus its resolve/reject handles. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAppQueries', () => {
  it('resolves a dynamic batch in parallel, mapping each raw→domain and aggregating loading', async () => {
    const gate = [deferred<{ id: number }>(), deferred<{ id: number }>(), deferred<{ id: number }>()];
    const { result } = renderHook(
      () =>
        useAppQueries<{ id: number }, string>({
          queries: gate.map((d, i) => ({
            key: ['batch', i],
            queryFn: () => d.promise,
            map: (raw) => `#${raw.id}`,
          })),
        }),
      { wrapper: createQueryWrapper() },
    );

    // Every entry pending → aggregate loading true, no data yet.
    expect(result.current.results).toHaveLength(3);
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([undefined, undefined, undefined]);

    gate.forEach((d, i) => d.resolve({ id: i + 1 }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['#1', '#2', '#3']);
    expect(result.current.results.every((entry) => entry.error === null)).toBe(true);
    expect(result.current.errors).toEqual([]);
  });

  it('is identity when map is omitted', async () => {
    const { result } = renderHook(
      () =>
        useAppQueries<{ v: number }>({
          queries: [{ key: ['batch', 'identity'], queryFn: async () => ({ v: 7 }) }],
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.data).toEqual([{ v: 7 }]));
  });

  it('coerces a per-query rejection to ApiError while siblings still resolve', async () => {
    const { result } = renderHook(
      () =>
        useAppQueries<{ id: number }, string>({
          queries: [
            { key: ['batch', 'ok'], queryFn: async () => ({ id: 1 }), map: (raw) => `#${raw.id}` },
            {
              key: ['batch', 'fail'],
              queryFn: () => Promise.reject(new ApiError(404, null, 'missing')),
              map: (raw) => `#${raw.id}`,
            },
          ],
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.errors).toHaveLength(1));

    // Destructure (not index) so the SDK's `noUncheckedIndexedAccess` narrows via `?.` rather than erroring.
    const [ok, failed] = result.current.results;
    expect(ok?.data).toBe('#1');
    expect(ok?.error).toBeNull();
    expect(failed?.data).toBeUndefined();
    expect(failed?.error).toBeInstanceOf(ApiError);
    expect(failed?.error?.status).toBe(404);
    expect(result.current.errors[0]).toBeInstanceOf(ApiError);
  });
});
