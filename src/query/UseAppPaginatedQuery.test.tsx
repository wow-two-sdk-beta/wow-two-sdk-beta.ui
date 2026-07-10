import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { ApiError } from '../foundation/http';

import { useAppPaginatedQuery } from './UseAppPaginatedQuery';
import { createQueryWrapper } from './QueryTestUtils';

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

interface Page {
  readonly rows: string[];
}

describe('useAppPaginatedQuery', () => {
  it('returns the controlled page, mapping page→items', async () => {
    // Fixtures as consts (not a `Record<number, …>`) so the lookup is total — the SDK's
    // `noUncheckedIndexedAccess` would otherwise widen an index read to `Page | undefined`.
    const page0: Page = { rows: ['a', 'b'] };
    const page1: Page = { rows: ['c', 'd'] };
    const { result } = renderHook(
      () =>
        useAppPaginatedQuery<string, Page>({
          key: ['paged'],
          page: 0,
          queryFn: async ({ page }) => (page === 0 ? page0 : page1),
          mapPage: (page) => page.rows,
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.items).toEqual(['a', 'b']));
    expect(result.current.loading).toBe(false);
    expect(result.current.isPlaceholder).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('keeps previous items while the next page loads (isPlaceholder), then resolves', async () => {
    const page0 = deferred<Page>();
    const page1 = deferred<Page>();

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) =>
        useAppPaginatedQuery<string, Page>({
          key: ['paged', 'keep'],
          page,
          queryFn: ({ page: p }) => (p === 0 ? page0 : page1).promise,
          mapPage: (page) => page.rows,
        }),
      { wrapper: createQueryWrapper(), initialProps: { page: 0 } },
    );

    // First page — hard load, no placeholder.
    expect(result.current.loading).toBe(true);
    expect(result.current.isPlaceholder).toBe(false);

    page0.resolve({ rows: ['a', 'b'] });
    await waitFor(() => expect(result.current.items).toEqual(['a', 'b']));
    expect(result.current.isPlaceholder).toBe(false);

    // Navigate to page 1 — previous items stay put while the new page is in flight.
    rerender({ page: 1 });
    await waitFor(() => expect(result.current.isPlaceholder).toBe(true));
    expect(result.current.items).toEqual(['a', 'b']);
    expect(result.current.loading).toBe(false);

    // Page 1 resolves — items swap, placeholder clears.
    page1.resolve({ rows: ['c', 'd'] });
    await waitFor(() => expect(result.current.items).toEqual(['c', 'd']));
    expect(result.current.isPlaceholder).toBe(false);
  });

  it('coerces a page failure to ApiError', async () => {
    const { result } = renderHook(
      () =>
        useAppPaginatedQuery<string, Page>({
          key: ['paged', 'err'],
          page: 0,
          queryFn: () => Promise.reject(new ApiError(500, null, 'boom')),
        }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.error).toBeInstanceOf(ApiError));
    expect(result.current.error?.status).toBe(500);
    expect(result.current.items).toEqual([]);
  });
});
