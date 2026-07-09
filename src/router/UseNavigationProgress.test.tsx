import type { ReactNode } from 'react';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';

import { ProgressProvider, useNavigationProgress } from './UseNavigationProgress';

afterEach(cleanup);

/** Wraps a hook under test in a real ProgressProvider. */
function wrapper({ children }: { children: ReactNode }) {
  return <ProgressProvider>{children}</ProgressProvider>;
}

/** A promise plus its resolve/reject handles. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useNavigationProgress', () => {
  it('throws when used outside a ProgressProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNavigationProgress())).toThrow(/ProgressProvider/);
    spy.mockRestore();
  });

  it('begin() flips isBusy and end() clears it', () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });

    expect(result.current.isBusy).toBe(false);
    act(() => {
      result.current.begin();
    });
    expect(result.current.isBusy).toBe(true);

    act(() => {
      result.current.end();
    });
    expect(result.current.isBusy).toBe(false);
  });

  it('ref-counts concurrent begins — stays busy until the last end', () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });

    act(() => {
      result.current.begin();
      result.current.begin();
    });
    expect(result.current.isBusy).toBe(true);

    act(() => {
      result.current.end();
    });
    expect(result.current.isBusy).toBe(true); // one span still open

    act(() => {
      result.current.end();
    });
    expect(result.current.isBusy).toBe(false);
  });

  it('the ender returned by begin() is idempotent — a double call underflows nothing', () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });

    let endFirst!: () => void;
    act(() => {
      endFirst = result.current.begin();
      result.current.begin(); // second span open
    });
    expect(result.current.isBusy).toBe(true);

    act(() => {
      endFirst();
      endFirst(); // idempotent — must not decrement the second span
    });
    expect(result.current.isBusy).toBe(true); // second span still open
  });

  it('end() clamps at zero — an unmatched end never goes negative', () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });

    act(() => {
      result.current.end(); // no matching begin
    });
    expect(result.current.isBusy).toBe(false);

    act(() => {
      result.current.begin();
    });
    expect(result.current.isBusy).toBe(true); // count started from 0, not -1
  });

  it('track() is busy while pending, idle after resolve, and passes the value through', async () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });
    const d = deferred<string>();

    let tracked!: Promise<string>;
    act(() => {
      tracked = result.current.track(d.promise);
    });
    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      d.resolve('payload');
      await tracked.then((v) => expect(v).toBe('payload'));
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it('track() clears busy and propagates rejection', async () => {
    const { result } = renderHook(() => useNavigationProgress(), { wrapper });
    const d = deferred<string>();

    let tracked!: Promise<string>;
    act(() => {
      tracked = result.current.track(d.promise);
    });
    expect(result.current.isBusy).toBe(true);

    await act(async () => {
      d.reject(new Error('boom'));
      await expect(tracked).rejects.toThrow('boom');
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });
});
