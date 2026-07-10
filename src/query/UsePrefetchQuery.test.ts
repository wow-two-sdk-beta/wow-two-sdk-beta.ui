import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { createQueryWrapper, createTestQueryClient } from './QueryTestUtils';
import { prefetchProps, usePrefetchQuery, type PrefetchTarget } from './UsePrefetchQuery';

const target = (): PrefetchTarget => ({
  key: ['transcript', 'abc'],
  queryFn: vi.fn().mockResolvedValue({ id: 'abc' }),
});

describe('usePrefetchQuery', () => {
  it('prefetch warms the query on the active client exactly once, with the given key', () => {
    const client = createTestQueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrefetchQuery(), { wrapper: createQueryWrapper(client) });

    const t = target();
    result.current(t);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: t.key, queryFn: t.queryFn }));
  });

  it('prefetch returns a stable identity across re-renders', () => {
    const client = createTestQueryClient();
    const { result, rerender } = renderHook(() => usePrefetchQuery(), {
      wrapper: createQueryWrapper(client),
    });

    const first = result.current;
    rerender();

    expect(result.current).toBe(first);
  });

  it('prefetchProps returns hover/focus handlers that both warm the query with the given key', () => {
    const client = createTestQueryClient();
    const spy = vi.spyOn(client, 'prefetchQuery').mockResolvedValue(undefined);
    // Mount the hook to bind the client for the standalone prefetchProps.
    renderHook(() => usePrefetchQuery(), { wrapper: createQueryWrapper(client) });

    const t = target();
    const props = prefetchProps(t);
    (props.onMouseEnter as () => void)();
    (props.onFocus as () => void)();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ queryKey: t.key }));
  });
});
