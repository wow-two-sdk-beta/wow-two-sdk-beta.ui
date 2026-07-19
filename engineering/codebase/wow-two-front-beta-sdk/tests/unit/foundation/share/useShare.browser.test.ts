import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useShare, type ShareOrCopyResult, type ShareResult } from '@src/foundation/share';

import { stubClipboard } from '../../testing/stubClipboard';

// Browser project — `useShare` needs a real renderer, so the pure-logic cases stay in `share.test.ts` and this
// file only covers what a renderer adds: the pending flag's two edges, and the result landing in state.
//
// Headless chromium has no `navigator.share` of its own, so each test installs an instance-level stub and
// `afterEach` deletes it — leaving the desktop "no sheet" default, which is also the fallback path's setup.
// Clipboard writing reuses the repo's `stubClipboard` (the harness grants no clipboard permission, so the real
// `writeText` rejects); imported from its file rather than the `testing` barrel, which pulls in `storybook/test`.

/** A promise plus its settle handles — lets a test observe the in-flight state before resolving. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Installs an instance-level `navigator.share`, shadowing the (absent) native one. */
function stubShare(implementation: () => Promise<void>): void {
  Object.defineProperty(navigator, 'share', { value: implementation, configurable: true });
}

afterEach(() => {
  delete (navigator as { share?: unknown }).share;
});

describe('useShare', () => {
  it('starts idle with no result', () => {
    const { result } = renderHook(() => useShare());

    expect(result.current.state).toBe('idle');
    expect(result.current.sharing).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.copied).toBe(false);
  });

  it('flips to sharing while in flight, then back to idle carrying the result', async () => {
    const gate = deferred<void>();
    stubShare(() => gate.promise);

    const { result } = renderHook(() => useShare());

    let pending!: Promise<ShareResult>;
    act(() => {
      pending = result.current.share({ url: 'https://example.com' });
    });
    expect(result.current.state).toBe('sharing');
    expect(result.current.sharing).toBe(true);

    await act(async () => {
      gate.resolve();
      await pending;
    });

    expect(result.current.state).toBe('idle');
    expect(result.current.result).toEqual({ status: 'shared' });
  });

  it('resolves rather than throwing when the user dismisses the sheet', async () => {
    stubShare(() => Promise.reject(new DOMException('Share canceled', 'AbortError')));

    const { result } = renderHook(() => useShare());

    let outcome!: ShareResult;
    await act(async () => {
      outcome = await result.current.share({ url: 'https://example.com' });
    });

    expect(outcome).toEqual({ status: 'dismissed' });
    expect(result.current.result).toEqual({ status: 'dismissed' });
    expect(result.current.copied).toBe(false);
  });

  it('shareOrCopy falls back to the clipboard and raises copied', async () => {
    const clipboard = stubClipboard();
    try {
      const { result } = renderHook(() => useShare());

      let outcome!: ShareOrCopyResult;
      await act(async () => {
        outcome = await result.current.shareOrCopy({ title: 'T', url: 'https://example.com' });
      });

      expect(outcome).toEqual({ status: 'copied' });
      expect(result.current.copied).toBe(true);
      expect(clipboard.writes).toEqual(['https://example.com']);
      expect(result.current.state).toBe('idle');
    } finally {
      clipboard.restore();
    }
  });

  it('reset clears the last result', async () => {
    stubShare(() => Promise.resolve());

    const { result } = renderHook(() => useShare());

    await act(async () => {
      await result.current.share({ url: 'https://example.com' });
    });
    expect(result.current.result).toEqual({ status: 'shared' });

    act(() => {
      result.current.reset();
    });
    expect(result.current.result).toBeNull();
    expect(result.current.state).toBe('idle');
  });
});
