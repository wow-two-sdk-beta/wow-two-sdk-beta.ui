import type { ComponentType } from 'react';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';

import type { LazyRoute } from './RouteConfig';
import { prefetch, prefetchProps, usePrefetch } from './UsePrefetch';

afterEach(cleanup);

/** Builds a fresh mock importer — a new reference each call, so the module-level dedupe set never carries across cases. */
function makeImporter() {
  return vi.fn<LazyRoute>(() => Promise.resolve({ default: (() => null) as ComponentType }));
}

describe('prefetch', () => {
  it('fires the importer once even when called twice', () => {
    const importer = makeImporter();

    prefetch(importer);
    prefetch(importer);

    expect(importer).toHaveBeenCalledTimes(1);
  });
});

describe('prefetchProps', () => {
  it('onMouseEnter warms the chunk once across repeat hovers', () => {
    const importer = makeImporter();
    const props = prefetchProps(importer);

    (props.onMouseEnter as () => void)();
    (props.onMouseEnter as () => void)();

    expect(importer).toHaveBeenCalledTimes(1);
  });

  it('onFocus warms the chunk', () => {
    const importer = makeImporter();

    (prefetchProps(importer).onFocus as () => void)();

    expect(importer).toHaveBeenCalledTimes(1);
  });
});

describe('usePrefetch', () => {
  it('returns a prefetch fn that warms a chunk once', () => {
    const importer = makeImporter();
    const { result } = renderHook(() => usePrefetch());

    result.current(importer);
    result.current(importer);

    expect(importer).toHaveBeenCalledTimes(1);
  });
});
