import { describe, it, expect, vi, afterEach } from 'vitest';
import type { ComponentType } from 'react';

import { lazyRoute, reloadOnChunkError } from './LazyRoute';

const routeModule = { default: (() => null) as ComponentType };

describe('lazyRoute', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resolves when the importer succeeds on the retry', async () => {
    vi.useFakeTimers();
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error('ChunkLoadError'))
      .mockResolvedValueOnce(routeModule);

    const promise = lazyRoute(importer)();
    await vi.runAllTimersAsync(); // drive the retry delay + settle both attempts

    await expect(promise).resolves.toBe(routeModule);
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it('rejects after a persistent failure so the errorElement can catch it', async () => {
    vi.useFakeTimers();
    const importer = vi.fn().mockRejectedValue(new Error('ChunkLoadError'));

    const promise = lazyRoute(importer)();
    const assertion = expect(promise).rejects.toThrow('ChunkLoadError'); // attach handler first
    await vi.runAllTimersAsync();

    await assertion;
    expect(importer).toHaveBeenCalledTimes(2); // original + one retry, no more
  });

  it('does not delay or retry when the importer succeeds first try', async () => {
    vi.useFakeTimers();
    const importer = vi.fn().mockResolvedValue(routeModule);

    const promise = lazyRoute(importer)();
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe(routeModule);
    expect(importer).toHaveBeenCalledTimes(1);
  });
});

describe('reloadOnChunkError', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forces a full page reload', () => {
    // Runs in the node `unit` project: stub `window` wholesale (a real browser locks `window.location`
    // and its `reload` as non-configurable, so it can't be intercepted there — hence the node tier).
    const reload = vi.fn();
    vi.stubGlobal('window', { location: { reload } });

    reloadOnChunkError();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
