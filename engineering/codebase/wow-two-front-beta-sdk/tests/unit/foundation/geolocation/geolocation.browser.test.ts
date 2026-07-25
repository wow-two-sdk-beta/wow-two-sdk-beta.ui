import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useGeolocation, useWatchPosition, type Position } from '@src/foundation/geolocation';

// Browser project — real chromium, so the hooks run through a genuine renderer and effect cleanup is React's,
// not a simulation of it. `navigator.geolocation` is still faked: a real one would prompt, and a headless
// browser has no fix to give.
//
// The fake keeps its registrations INDEXED rather than firing them all at once, because two of the behaviours
// under test are about WHICH registration answers: the stale-response guard (an older request resolving after a
// newer one must not write state) and the watch restart (a dependency change disposes registration n and opens
// n+1).
//
// The load-bearing assertion in this file is the unmount one. A watch survives the component that started it —
// it is a browser-level registration, not a subscription React knows about — so "unmount clears the watch" is
// the difference between a feature and a background GPS drain that no page metric attributes to anything.

/** What the platform hands a geolocation callback — untyped, since the module treats it as unknown. */
type RawCallback = (raw: unknown) => void;

/** One registered request or watch. */
interface Registration {
  readonly success: RawCallback;
  readonly failure: RawCallback | undefined;
  readonly options: unknown;
}

/** A hand-driven stand-in for `navigator.geolocation`, with per-registration control. */
interface FakeGeolocation {
  /** Every `getCurrentPosition` / `watchPosition` call, in order. */
  readonly registrations: Registration[];
  /** Every id passed to `clearWatch`, in order. */
  readonly cleared: number[];
  /** Fires registration `index`'s success callback. */
  succeed(index: number, raw: unknown): void;
  /** Fires registration `index`'s error callback. */
  fail(index: number, raw: unknown): void;
}

/** Watch ids start here and increment, so a restart is visible as a different cleared id. */
const FirstWatchId = 100;

function installGeolocation(): FakeGeolocation {
  const registrations: Registration[] = [];
  const cleared: number[] = [];
  let nextWatchId = FirstWatchId;

  const register = (success: RawCallback, failure: RawCallback | undefined, options: unknown): void => {
    registrations.push({ success, failure, options });
  };

  const api = {
    getCurrentPosition: (success: RawCallback, failure?: RawCallback, options?: unknown): void => {
      register(success, failure, options);
    },
    watchPosition: (success: RawCallback, failure?: RawCallback, options?: unknown): number => {
      register(success, failure, options);
      nextWatchId += 1;
      return nextWatchId;
    },
    clearWatch: (id: number): void => {
      cleared.push(id);
    },
  };

  Object.defineProperty(navigator, 'geolocation', { value: api, configurable: true });

  /** Reads a registration, failing loudly rather than silently no-oping on a wrong index. */
  const at = (index: number): Registration => {
    const registration = registrations.at(index);
    if (registration === undefined) throw new Error(`no geolocation registration at index ${String(index)}`);
    return registration;
  };

  return {
    registrations,
    cleared,
    succeed: (index, raw) => at(index).success(raw),
    fail: (index, raw) => at(index).failure?.(raw),
  };
}

/** Removes the geolocation object entirely — the `unsupported` shape. */
function installNoGeolocation(): void {
  Object.defineProperty(navigator, 'geolocation', { value: undefined, configurable: true });
}

afterEach(() => {
  cleanup();
  delete (navigator as unknown as { geolocation?: unknown }).geolocation;
});

/** A host-like object: fields behind non-enumerable prototype accessors, as the platform's own objects are. */
function hostObject(fields: Readonly<Record<string, unknown>>): object {
  const prototype: object = {};
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(prototype, key, { get: () => value, enumerable: false, configurable: true });
  }
  return Object.create(prototype) as object;
}

/** A raw fix at `latitude`/`longitude`, host-shaped. */
function rawPosition(latitude: number, longitude: number, timestamp = 1_700_000_000_000): object {
  return hostObject({
    coords: hostObject({
      latitude,
      longitude,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    }),
    timestamp,
  });
}

/** The snapshot `rawPosition` converts to. */
function snapshot(latitude: number, longitude: number, timestamp = 1_700_000_000_000): Position {
  return {
    latitude,
    longitude,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    timestamp,
  };
}

/** The platform's error object — a numeric `code`, not an `Error`. */
function positionError(code: number): object {
  return hostObject({ code, message: 'stub' });
}

describe('useGeolocation', () => {
  it('starts idle and requests nothing on mount', () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.status).toBe('idle');
    expect(result.current.position).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.locating).toBe(false);
    // The permission prompt must be the consumer's explicit act, never a side effect of rendering.
    expect(fake.registrations).toHaveLength(0);
  });

  it('reports locating while a request is in flight', () => {
    installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      void result.current.request();
    });

    expect(result.current.status).toBe('locating');
    expect(result.current.locating).toBe(true);
  });

  it('records a fix as the plain snapshot', async () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      const pending = result.current.request();
      fake.succeed(0, rawPosition(48.8566, 2.3522));
      await pending;
    });

    expect(result.current.status).toBe('ok');
    expect(result.current.position).toEqual(snapshot(48.8566, 2.3522));
    expect(result.current.error).toBeNull();
    expect(result.current.locating).toBe(false);
  });

  it('maps a denial onto the denied status without an error object', async () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      const pending = result.current.request();
      fake.fail(0, positionError(1));
      await pending;
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.error).toBeNull();
  });

  it('reports unsupported where there is no API', async () => {
    installNoGeolocation();
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      await result.current.request();
    });

    expect(result.current.status).toBe('unsupported');
  });

  it('keeps the last fix through a later failure', async () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      const pending = result.current.request();
      fake.succeed(0, rawPosition(10, 20));
      await pending;
    });
    await act(async () => {
      const pending = result.current.request();
      fake.fail(1, positionError(3));
      await pending;
    });

    expect(result.current.status).toBe('timeout');
    expect(result.current.position).toEqual(snapshot(10, 20));
  });

  it('passes hook options through, and lets a per-call override replace them', async () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation({ timeout: 5_000 }));

    await act(async () => {
      const pending = result.current.request();
      fake.succeed(0, rawPosition(1, 2));
      await pending;
    });
    await act(async () => {
      const pending = result.current.request({ enableHighAccuracy: true });
      fake.succeed(1, rawPosition(1, 2));
      await pending;
    });

    expect(fake.registrations.at(0)?.options).toEqual({ timeout: 5_000 });
    expect(fake.registrations.at(1)?.options).toEqual({ enableHighAccuracy: true });
  });

  it('ignores a stale response that resolves after a newer request', async () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useGeolocation());

    await act(async () => {
      const first = result.current.request();
      const second = result.current.request();

      // The NEWER request answers first, then the older one straggles in.
      fake.fail(1, positionError(1));
      fake.succeed(0, rawPosition(10, 20));
      await Promise.all([first, second]);
    });

    // The stale `ok` must not overwrite the fresh denial.
    expect(result.current.status).toBe('denied');
    expect(result.current.position).toBeNull();
  });

  it('keeps request stable across renders', () => {
    installGeolocation();
    const { result, rerender } = renderHook(() => useGeolocation({ timeout: 1_000 }));
    const first = result.current.request;

    rerender();

    expect(result.current.request).toBe(first);
  });
});

describe('useWatchPosition', () => {
  it('opens a watch on mount and reports locating', () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useWatchPosition());

    expect(fake.registrations).toHaveLength(1);
    expect(result.current.status).toBe('locating');
  });

  it('reports each fix as it arrives', () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useWatchPosition());

    act(() => fake.succeed(0, rawPosition(10, 20)));
    expect(result.current.position).toEqual(snapshot(10, 20));

    act(() => fake.succeed(0, rawPosition(30, 40, 1_700_000_001_000)));
    expect(result.current.status).toBe('ok');
    expect(result.current.position).toEqual(snapshot(30, 40, 1_700_000_001_000));
  });

  it('clears the watch on unmount — a leaked watch keeps the GPS radio on', () => {
    const fake = installGeolocation();
    const { unmount } = renderHook(() => useWatchPosition());

    expect(fake.cleared).toEqual([]);

    unmount();

    expect(fake.cleared).toEqual([FirstWatchId + 1]);
  });

  it('stops updating after unmount', () => {
    const fake = installGeolocation();
    const { result, unmount } = renderHook(() => useWatchPosition());

    act(() => fake.succeed(0, rawPosition(10, 20)));
    const beforeUnmount = result.current.position;
    unmount();

    // A fix the platform had already queued arriving after teardown must reach nothing.
    expect(() => act(() => fake.succeed(0, rawPosition(99, 99)))).not.toThrow();
    expect(result.current.position).toEqual(beforeUnmount);
  });

  it('restarts the watch when an option value changes, clearing the old one', () => {
    const fake = installGeolocation();
    const { rerender } = renderHook(({ timeout }: { timeout: number }) => useWatchPosition({ timeout }), {
      initialProps: { timeout: 1_000 },
    });

    rerender({ timeout: 2_000 });

    expect(fake.cleared).toEqual([FirstWatchId + 1]);
    expect(fake.registrations).toHaveLength(2);
    expect(fake.registrations.at(1)?.options).toEqual({
      enableHighAccuracy: undefined,
      timeout: 2_000,
      maximumAge: undefined,
    });
  });

  it('does not restart on a re-render with a fresh options literal of the same values', () => {
    const fake = installGeolocation();
    const { rerender } = renderHook(() => useWatchPosition({ timeout: 1_000, enableHighAccuracy: true }));

    rerender();
    rerender();

    expect(fake.registrations).toHaveLength(1);
    expect(fake.cleared).toEqual([]);
  });

  it('reports a failure without erasing the last fix', () => {
    const fake = installGeolocation();
    const { result } = renderHook(() => useWatchPosition());

    act(() => fake.succeed(0, rawPosition(10, 20)));
    act(() => fake.fail(0, positionError(2)));

    expect(result.current.status).toBe('unavailable');
    expect(result.current.position).toEqual(snapshot(10, 20));
  });

  it('reports unsupported where there is no API', () => {
    installNoGeolocation();
    const { result, unmount } = renderHook(() => useWatchPosition());

    expect(result.current.status).toBe('unsupported');
    expect(() => unmount()).not.toThrow();
  });
});
