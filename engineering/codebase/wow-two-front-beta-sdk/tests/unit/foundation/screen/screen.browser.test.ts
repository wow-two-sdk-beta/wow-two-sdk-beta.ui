import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFullscreen, useOrientation, useWakeLock } from '@src/foundation/screen';

// Browser project — the three hooks need a real renderer, so the pure-logic cases (including the wake-lock
// re-acquire cycle, which lives in `holdWakeLock` precisely so it can be tested without one) stay in
// `screen.test.ts`. This file covers only what a renderer adds: that subscriptions and locks are torn down.
//
// Both teardown assertions are leak tests, and both leaks are invisible in normal use. A `useFullscreen` that
// never unsubscribes accumulates listeners on the document across every mount for the life of the page; a
// `useWakeLock` that never releases keeps the user's screen awake after they have navigated away. Neither shows
// up as a failing render, so nothing but an explicit test catches them.
//
// Headless chromium exposes a real `navigator.wakeLock` that would grant actual locks, so each wake-lock test
// shadows it with an instance-level stub and `afterEach` deletes it, restoring the native one.

/** The event names `useFullscreen` subscribes to, in both spellings. */
const FullscreenEvents = ['fullscreenchange', 'webkitfullscreenchange'];

/** A stand-in `navigator.wakeLock` that counts requests and releases. */
function stubWakeLock(): { counts: { requests: number; releases: number } } {
  const counts = { requests: 0, releases: 0 };

  const wakeLock = {
    request: (): Promise<unknown> => {
      counts.requests += 1;
      const sentinel = {
        released: false,
        release: (): Promise<void> => {
          counts.releases += 1;
          sentinel.released = true;
          return Promise.resolve();
        },
      };
      return Promise.resolve(sentinel);
    },
  };

  Object.defineProperty(navigator, 'wakeLock', { value: wakeLock, configurable: true });
  return { counts };
}

/** Shadows `navigator.wakeLock` with `undefined` — chromium ships a real one, so absence must be simulated. */
function removeWakeLock(): void {
  Object.defineProperty(navigator, 'wakeLock', { value: undefined, configurable: true });
}

afterEach(() => {
  delete (navigator as { wakeLock?: unknown }).wakeLock;
  vi.restoreAllMocks();
});

describe('useFullscreen', () => {
  it('reports the document state and the API as supported', () => {
    const { result } = renderHook(() => useFullscreen());

    expect(result.current.isFullscreen).toBe(false);
    expect(result.current.supported).toBe(true);
  });

  it('removes every listener it added on unmount', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useFullscreen());

    const added = addSpy.mock.calls.filter(([type]) => FullscreenEvents.includes(type)).length;
    expect(added).toBeGreaterThan(0);
    expect(removeSpy.mock.calls.filter(([type]) => FullscreenEvents.includes(type))).toHaveLength(0);

    unmount();

    const removed = removeSpy.mock.calls.filter(([type]) => FullscreenEvents.includes(type)).length;
    expect(removed).toBe(added);
  });

  it('keeps its callbacks stable across renders', () => {
    const { result, rerender } = renderHook(() => useFullscreen());
    const first = result.current;

    rerender();

    expect(result.current.enter).toBe(first.enter);
    expect(result.current.exit).toBe(first.exit);
    expect(result.current.toggle).toBe(first.toggle);
  });

  it('resolves rather than throwing when entering outside a user gesture', async () => {
    const { result } = renderHook(() => useFullscreen());

    // No transient activation here, so the platform refuses — the point is that it resolves at all.
    const outcome = await result.current.enter();

    expect(['ok', 'requires-gesture', 'denied', 'failed', 'unsupported']).toContain(outcome.status);
  });

  it('exits idempotently when nothing is presented', async () => {
    const { result } = renderHook(() => useFullscreen());

    await expect(result.current.exit()).resolves.toEqual({ status: 'ok' });
  });
});

describe('useWakeLock', () => {
  it('acquires while active and RELEASES ON UNMOUNT', async () => {
    const lock = stubWakeLock();

    const { result, unmount } = renderHook(() => useWakeLock(true));

    await waitFor(() => expect(result.current.held).toBe(true));
    expect(lock.counts.requests).toBe(1);
    expect(lock.counts.releases).toBe(0);

    unmount();

    await waitFor(() => expect(lock.counts.releases).toBe(1));
  });

  it('releases when active flips to false, and re-acquires when it flips back', async () => {
    const lock = stubWakeLock();

    const { result, rerender } = renderHook(({ active }: { active: boolean }) => useWakeLock(active), {
      initialProps: { active: true },
    });

    await waitFor(() => expect(result.current.held).toBe(true));

    rerender({ active: false });
    await waitFor(() => expect(lock.counts.releases).toBe(1));
    expect(result.current).toEqual({ held: false, status: 'idle', error: null });

    rerender({ active: true });
    await waitFor(() => expect(result.current.held).toBe(true));
    expect(lock.counts.requests).toBe(2);
  });

  it('never requests while inactive', async () => {
    const lock = stubWakeLock();

    const { result } = renderHook(() => useWakeLock(false));

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(lock.counts.requests).toBe(0);
    expect(result.current.held).toBe(false);
  });

  it('reports unsupported without throwing when the API is absent', async () => {
    removeWakeLock();

    const { result } = renderHook(() => useWakeLock(true));

    await waitFor(() => expect(result.current.status).toBe('unsupported'));
    expect(result.current).toEqual({ held: false, status: 'unsupported', error: null });
  });
});

describe('useOrientation', () => {
  it('reads the current orientation and keeps its callbacks stable', () => {
    const { result, rerender } = renderHook(() => useOrientation());
    const first = result.current;

    expect(typeof result.current.supported).toBe('boolean');
    expect(result.current.orientation === null || typeof result.current.orientation === 'string').toBe(true);
    expect(result.current.angle === null || typeof result.current.angle === 'number').toBe(true);

    rerender();

    expect(result.current.lock).toBe(first.lock);
    expect(result.current.unlock).toBe(first.unlock);
  });

  it('resolves a lock attempt outside fullscreen instead of throwing', async () => {
    const { result } = renderHook(() => useOrientation());

    const outcome = await result.current.lock('landscape');

    expect(['ok', 'unsupported', 'denied', 'requires-gesture', 'requires-fullscreen', 'failed']).toContain(
      outcome.status,
    );
  });

  it('unlocks without throwing', () => {
    const { result } = renderHook(() => useOrientation());

    expect(() => result.current.unlock()).not.toThrow();
  });
});
