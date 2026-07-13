import { QueryClient } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { defineEndpoint } from '@src/query/Endpoints';
import { createQueryWrapper, createTestQueryClient } from '@src/query/QueryTestUtils';
import { useAppQuery } from '@src/query/UseAppQuery';
import { usePrefetchQuery } from '@src/query/UsePrefetchQuery';
import { useQueryCache } from '@src/query/UseQueryCache';

/** The raw DTO shape the fake endpoints below fetch. */
interface CodeDto {
  readonly id: string;
}

/** A parameterized endpoint factory over a spyable fetcher — the app-side declaration shape. */
function createCodesApi() {
  const queryFn = vi.fn(async ({ signal }: { signal: AbortSignal }): Promise<CodeDto[]> => {
    expect(signal).toBeInstanceOf(AbortSignal);
    return [{ id: 'a' }, { id: 'b' }];
  });
  const list = (q?: string) => defineEndpoint({ key: ['codes', 'list', q ?? ''] as const, queryFn });
  return { list, queryFn };
}

describe('defineEndpoint × query hooks', () => {
  it('spreads into useAppQuery — TRaw flows to map, data resolves mapped', async () => {
    const api = createCodesApi();
    const { result } = renderHook(
      () => useAppQuery({ ...api.list('q'), map: (raw) => raw.map((dto) => dto.id) }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    const ids: readonly string[] | undefined = result.current.data; // TData inferred from map
    expect(ids).toEqual(['a', 'b']);
    expect(api.queryFn).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('pairs key ↔ fetcher — the cache reads the raw payload back under the def key', async () => {
    const api = createCodesApi();
    const def = api.list();
    const { result } = renderHook(
      () => ({
        query: useAppQuery({ ...def, map: (raw) => raw.length }),
        cache: useQueryCache(),
      }),
      { wrapper: createQueryWrapper() },
    );

    await waitFor(() => expect(result.current.query.data).toBe(2));

    // Same def, different surface — the imperative cache resolves the identical entry.
    expect(result.current.cache.get<CodeDto[]>(def.key)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('feeds usePrefetchQuery whole — the warm fills the key a later spread query reuses', async () => {
    const api = createCodesApi();
    const def = api.list('warm');
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false } },
    });

    const warmed = renderHook(() => usePrefetchQuery(), { wrapper: createQueryWrapper(client) });
    act(() => {
      warmed.result.current(def);
    });
    await waitFor(() => expect(client.getQueryData(def.key)).toEqual([{ id: 'a' }, { id: 'b' }]));

    const { result } = renderHook(() => useAppQuery<CodeDto[]>({ ...def }), {
      wrapper: createQueryWrapper(client),
    });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 'a' }, { id: 'b' }]));
    expect(api.queryFn).toHaveBeenCalledTimes(1); // fresh at the same key — no refetch
  });

  it('feeds useQueryCache().prefetch whole', async () => {
    const api = createCodesApi();
    const def = api.list('cache');
    const client = createTestQueryClient();
    const { result } = renderHook(() => useQueryCache(), { wrapper: createQueryWrapper(client) });

    await act(async () => {
      await result.current.prefetch(def);
    });

    expect(api.queryFn).toHaveBeenCalledTimes(1);
    expect(client.getQueryData(def.key)).toEqual([{ id: 'a' }, { id: 'b' }]);
  });
});
