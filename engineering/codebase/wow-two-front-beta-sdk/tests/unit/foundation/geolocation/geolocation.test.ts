import { afterEach, describe, expect, it } from 'vitest';

import {
  applyPositionResult,
  IdleGeolocationReading,
  type GeolocationReading,
} from '@src/foundation/geolocation/GeolocationReading';
import {
  canLocate,
  distanceBetween,
  getCurrentPosition,
  getGeolocationPermission,
  UnreadablePositionMessage,
  watchPosition,
  type Position,
  type PositionResult,
} from '@src/foundation/geolocation';

// Node project — the whole non-React surface is capability detection, two callback-shaped platform calls, and
// pure spherical trigonometry, so fake globals are all it needs; no DOM, no renderer. Node ships a `navigator`
// with no `geolocation`, which is already the "API absent" shape, so each test installs only what its case
// needs and `afterEach` puts the global back — a leaked stub would silently turn the SSR assertions green. The
// two hooks need a renderer and live in `geolocation.browser.test.ts`.
//
// The fake is HAND-DRIVEN rather than auto-firing: it records the callbacks the module registers, and the test
// fires them. That is the only way to exercise a watch (many emissions from one registration), to fire BOTH
// callbacks for one request, and to emit after disposal.
//
// Position fixtures are built as HOST-LIKE objects — data behind prototype accessors, nothing own-enumerable —
// because that is what makes the real `GeolocationPosition` unusable as consumer state, and the conversion this
// slice performs is only meaningfully tested against that shape. `JSON.stringify` of a fixture is `'{}'`; of
// the converted snapshot, the real data.

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

/** Replaces the `navigator` global. `undefined` reproduces SSR, where `typeof navigator === 'undefined'`. */
function installNavigator(value: unknown): void {
  Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
}

afterEach(() => {
  if (originalNavigator === undefined) {
    delete (globalThis as { navigator?: unknown }).navigator;
  } else {
    Object.defineProperty(globalThis, 'navigator', originalNavigator);
  }
});

/** What the platform hands a geolocation callback — deliberately untyped, since the fakes supply garbage too. */
type RawCallback = (raw: unknown) => void;

/** How a test wants the fake `navigator.geolocation` to behave. */
interface FakeConfig {
  /** Makes `getCurrentPosition` / `watchPosition` throw this value instead of registering. */
  readonly throwOnRequest?: unknown;
  /** What `watchPosition` returns. Defaults to {@link DefaultWatchId}; may be a non-number on purpose. */
  readonly watchId?: unknown;
  /** Drops `watchPosition` entirely — a partial implementation. */
  readonly omitWatch?: boolean;
  /** Drops `clearWatch` entirely — the disposer must survive it. */
  readonly omitClear?: boolean;
  /** Makes `clearWatch` throw. */
  readonly throwOnClear?: boolean;
}

/** A hand-driven stand-in for `navigator.geolocation`. */
interface FakeGeolocation {
  /** The object installed as `navigator.geolocation`. */
  readonly api: Record<string, unknown>;
  /** The options argument of every request, in order. */
  readonly optionsSeen: unknown[];
  /** Every id passed to `clearWatch`, in order. */
  readonly cleared: unknown[];
  /** Fires every registered success callback with `raw`. */
  succeed(raw: unknown): void;
  /** Fires every registered error callback with `raw`. */
  fail(raw: unknown): void;
}

const DefaultWatchId = 7;

function createFakeGeolocation(config: FakeConfig = {}): FakeGeolocation {
  const successes: RawCallback[] = [];
  const failures: RawCallback[] = [];
  const optionsSeen: unknown[] = [];
  const cleared: unknown[] = [];

  const register = (success: RawCallback, failure: RawCallback | undefined, options: unknown): void => {
    if (config.throwOnRequest !== undefined) throw config.throwOnRequest;
    optionsSeen.push(options);
    successes.push(success);
    if (failure !== undefined) failures.push(failure);
  };

  const api: Record<string, unknown> = {
    getCurrentPosition: (success: RawCallback, failure?: RawCallback, options?: unknown): void => {
      register(success, failure, options);
    },
  };

  if (config.omitWatch !== true) {
    api.watchPosition = (success: RawCallback, failure?: RawCallback, options?: unknown): unknown => {
      register(success, failure, options);
      return config.watchId ?? DefaultWatchId;
    };
  }

  if (config.omitClear !== true) {
    api.clearWatch = (id: unknown): void => {
      if (config.throwOnClear === true) throw new Error('clearWatch is broken');
      cleared.push(id);
    };
  }

  return {
    api,
    optionsSeen,
    cleared,
    succeed: (raw) => {
      for (const callback of [...successes]) callback(raw);
    },
    fail: (raw) => {
      for (const callback of [...failures]) callback(raw);
    },
  };
}

/** Installs a fake geolocation on a fresh `navigator` and returns it. */
function installGeolocation(config: FakeConfig = {}): FakeGeolocation {
  const fake = createFakeGeolocation(config);
  installNavigator({ geolocation: fake.api });
  return fake;
}

/**
 * Builds a host-like object: every field behind a non-enumerable prototype accessor, so the object serializes
 * to `{}` exactly as a real `GeolocationPosition` does.
 */
function hostObject(fields: Readonly<Record<string, unknown>>): object {
  const prototype: object = {};
  for (const [key, value] of Object.entries(fields)) {
    Object.defineProperty(prototype, key, { get: () => value, enumerable: false, configurable: true });
  }
  return Object.create(prototype) as object;
}

const ParisTimestamp = 1_700_000_000_000;

/** The Paris fix, host-shaped, with every optional channel populated. */
function parisRaw(): object {
  return hostObject({
    coords: hostObject({
      latitude: 48.8566,
      longitude: 2.3522,
      accuracy: 12.5,
      altitude: 35,
      altitudeAccuracy: 4,
      heading: 90,
      speed: 1.4,
    }),
    timestamp: ParisTimestamp,
  });
}

/** The plain snapshot `parisRaw()` must convert to. */
const ParisSnapshot: Position = {
  latitude: 48.8566,
  longitude: 2.3522,
  accuracy: 12.5,
  altitude: 35,
  altitudeAccuracy: 4,
  heading: 90,
  speed: 1.4,
  timestamp: ParisTimestamp,
};

/** A minimal fix — only the three load-bearing fields, every optional channel absent. */
function minimalRaw(): object {
  return hostObject({
    coords: hostObject({ latitude: 10, longitude: 20, accuracy: 5 }),
    timestamp: 123,
  });
}

/** The platform's error object: an interface with a numeric `code`, not an `Error` subclass. */
function positionError(code: unknown, message = 'stub'): object {
  return hostObject({ code, message });
}

/** Requests a position and fires the fake's success callback with `raw`. */
async function requestWithSuccess(fake: FakeGeolocation, raw: unknown): Promise<PositionResult> {
  const pending = getCurrentPosition();
  fake.succeed(raw);
  return pending;
}

/** Requests a position and fires the fake's error callback with `raw`. */
async function requestWithError(fake: FakeGeolocation, raw: unknown): Promise<PositionResult> {
  const pending = getCurrentPosition();
  fake.fail(raw);
  return pending;
}

describe('canLocate — capability detection', () => {
  it('is false under SSR, with no navigator at all', () => {
    installNavigator(undefined);
    expect(typeof navigator).toBe('undefined');
    expect(canLocate()).toBe(false);
  });

  it('is false when navigator carries no geolocation', () => {
    installNavigator({});
    expect(canLocate()).toBe(false);
  });

  it('is false when geolocation is present but not callable', () => {
    installNavigator({ geolocation: { getCurrentPosition: 'not a function' } });
    expect(canLocate()).toBe(false);
  });

  it('is false when reading navigator throws', () => {
    installNavigator(
      new Proxy(
        {},
        {
          get: () => {
            throw new Error('hardened navigator');
          },
        },
      ),
    );
    expect(() => canLocate()).not.toThrow();
    expect(canLocate()).toBe(false);
  });

  it('is true with a usable API', () => {
    installGeolocation();
    expect(canLocate()).toBe(true);
  });
});

describe('getCurrentPosition — absent API', () => {
  it('resolves to unsupported under SSR without throwing', async () => {
    installNavigator(undefined);
    await expect(getCurrentPosition()).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves to unsupported when navigator carries no geolocation', async () => {
    installNavigator({});
    await expect(getCurrentPosition()).resolves.toEqual({ status: 'unsupported' });
  });
});

describe('getCurrentPosition — GeolocationPositionError code mapping', () => {
  it('maps code 1 (PERMISSION_DENIED) to denied', async () => {
    const fake = installGeolocation();
    await expect(requestWithError(fake, positionError(1))).resolves.toEqual({ status: 'denied' });
  });

  it('maps code 2 (POSITION_UNAVAILABLE) to unavailable', async () => {
    const fake = installGeolocation();
    await expect(requestWithError(fake, positionError(2))).resolves.toEqual({ status: 'unavailable' });
  });

  it('maps code 3 (TIMEOUT) to timeout', async () => {
    const fake = installGeolocation();
    await expect(requestWithError(fake, positionError(3))).resolves.toEqual({ status: 'timeout' });
  });

  it('maps an unrecognized code to failed rather than guessing a status', async () => {
    const fake = installGeolocation();
    const result = await requestWithError(fake, positionError(42));
    expect(result.status).toBe('failed');
  });

  it('maps code 0 to failed — only 1, 2 and 3 are meaningful', async () => {
    const fake = installGeolocation();
    expect((await requestWithError(fake, positionError(0))).status).toBe('failed');
  });

  it('maps a stringified code to failed — the comparison is numeric', async () => {
    const fake = installGeolocation();
    expect((await requestWithError(fake, positionError('1'))).status).toBe('failed');
  });

  it('maps an error with no code at all to failed, carrying a normalized Error', async () => {
    const fake = installGeolocation();
    const result = await requestWithError(fake, new Error('boom'));
    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error).toBeInstanceOf(Error);
  });

  it('survives an error object whose code getter throws', async () => {
    const fake = installGeolocation();
    const hostile = Object.defineProperty({}, 'code', {
      get: () => {
        throw new Error('trap');
      },
    });
    expect((await requestWithError(fake, hostile)).status).toBe('failed');
  });
});

describe('getCurrentPosition — success conversion', () => {
  it('converts the host position into the plain snapshot', async () => {
    const fake = installGeolocation();
    const result = await requestWithSuccess(fake, parisRaw());

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') return;
    expect(result.position).toEqual(ParisSnapshot);
  });

  it('hands back a flat snapshot, not the platform object', async () => {
    const fake = installGeolocation();
    const raw = parisRaw();
    const result = await requestWithSuccess(fake, raw);
    if (result.status !== 'ok') throw new Error('expected ok');

    expect(result.position).not.toBe(raw);
    expect('coords' in result.position).toBe(false);
    expect(Object.getPrototypeOf(result.position)).toBe(Object.prototype);
  });

  it('produces a snapshot that survives serialization where the platform object does not', async () => {
    const fake = installGeolocation();
    const raw = parisRaw();
    // The premise: a host object's data lives on prototype accessors, so it serializes to nothing.
    expect(JSON.stringify(raw)).toBe('{}');

    const result = await requestWithSuccess(fake, raw);
    if (result.status !== 'ok') throw new Error('expected ok');

    expect(JSON.parse(JSON.stringify(result.position))).toEqual(ParisSnapshot);
    expect(structuredClone(result.position)).toEqual(ParisSnapshot);
  });

  it('reports absent optional channels as null', async () => {
    const fake = installGeolocation();
    const result = await requestWithSuccess(fake, minimalRaw());
    if (result.status !== 'ok') throw new Error('expected ok');

    expect(result.position).toEqual({
      latitude: 10,
      longitude: 20,
      accuracy: 5,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      timestamp: 123,
    });
  });

  it('falls back to now for a missing timestamp', async () => {
    const fake = installGeolocation();
    const before = Date.now();
    const result = await requestWithSuccess(fake, hostObject({ coords: hostObject({ latitude: 1, longitude: 2, accuracy: 3 }) }));
    if (result.status !== 'ok') throw new Error('expected ok');

    expect(result.position.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.position.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it('fails rather than reporting ok when a load-bearing field is unreadable', async () => {
    const fake = installGeolocation();
    const result = await requestWithSuccess(
      fake,
      hostObject({ coords: hostObject({ latitude: '48.8566', longitude: 2.3522, accuracy: 5 }), timestamp: 1 }),
    );

    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error.message).toBe(UnreadablePositionMessage);
  });

  it('fails on a NaN latitude', async () => {
    const fake = installGeolocation();
    const raw = hostObject({ coords: hostObject({ latitude: Number.NaN, longitude: 2, accuracy: 5 }), timestamp: 1 });
    expect((await requestWithSuccess(fake, raw)).status).toBe('failed');
  });

  it('fails when accuracy is missing — a fix with no confidence radius is not a fix', async () => {
    const fake = installGeolocation();
    const raw = hostObject({ coords: hostObject({ latitude: 1, longitude: 2 }), timestamp: 1 });
    expect((await requestWithSuccess(fake, raw)).status).toBe('failed');
  });

  it('fails when the payload carries no coords', async () => {
    const fake = installGeolocation();
    expect((await requestWithSuccess(fake, hostObject({ timestamp: 1 }))).status).toBe('failed');
  });
});

describe('getCurrentPosition — call plumbing', () => {
  it('passes the options straight through to the platform', async () => {
    const fake = installGeolocation();
    const options = { enableHighAccuracy: true, timeout: 5_000, maximumAge: 30_000 };
    const pending = getCurrentPosition(options);
    fake.succeed(parisRaw());
    await pending;

    expect(fake.optionsSeen.at(0)).toEqual(options);
  });

  it('settles once — a second callback after the first is ignored', async () => {
    const fake = installGeolocation();
    const pending = getCurrentPosition();
    fake.succeed(parisRaw());
    fake.fail(positionError(1));

    const result = await pending;
    expect(result.status).toBe('ok');
  });

  it('resolves to failed when the platform call throws synchronously', async () => {
    const fake = installGeolocation({ throwOnRequest: new Error('insecure context') });
    const result = await getCurrentPosition();

    expect(result.status).toBe('failed');
    if (result.status === 'failed') expect(result.error.message).toBe('insecure context');
    expect(fake.optionsSeen).toHaveLength(0);
  });
});

describe('watchPosition — emissions', () => {
  it('emits an ok result per fix', () => {
    const fake = installGeolocation();
    const seen: PositionResult[] = [];
    const dispose = watchPosition((result) => seen.push(result));

    fake.succeed(parisRaw());
    fake.succeed(minimalRaw());
    dispose();

    expect(seen.map((result) => result.status)).toEqual(['ok', 'ok']);
    expect(seen.at(0)).toEqual({ status: 'ok', position: ParisSnapshot });
  });

  it('maps error codes through the same table as a one-shot read', () => {
    const fake = installGeolocation();
    const seen: PositionResult[] = [];
    const dispose = watchPosition((result) => seen.push(result));

    fake.fail(positionError(2));
    fake.fail(positionError(3));
    dispose();

    expect(seen.map((result) => result.status)).toEqual(['unavailable', 'timeout']);
  });

  it('emits unsupported exactly once, synchronously, where there is no API', () => {
    installNavigator(undefined);
    const seen: PositionResult[] = [];
    const dispose = watchPosition((result) => seen.push(result));

    expect(seen).toEqual([{ status: 'unsupported' }]);
    expect(() => dispose()).not.toThrow();
  });

  it('emits unsupported when the API exists without watchPosition', () => {
    installGeolocation({ omitWatch: true });
    const seen: PositionResult[] = [];
    watchPosition((result) => seen.push(result))();

    expect(seen).toEqual([{ status: 'unsupported' }]);
  });

  it('emits failed when watchPosition throws synchronously', () => {
    installGeolocation({ throwOnRequest: new Error('policy blocked') });
    const seen: PositionResult[] = [];
    watchPosition((result) => seen.push(result))();

    expect(seen.at(0)?.status).toBe('failed');
  });

  it('swallows a throw from the consumer handler and keeps emitting', () => {
    const fake = installGeolocation();
    let calls = 0;
    const dispose = watchPosition(() => {
      calls += 1;
      throw new Error('consumer render blew up');
    });

    expect(() => fake.succeed(parisRaw())).not.toThrow();
    expect(() => fake.succeed(parisRaw())).not.toThrow();
    dispose();

    expect(calls).toBe(2);
  });
});

describe('watchPosition — disposal', () => {
  it('clears the watch with the id the platform returned', () => {
    const fake = installGeolocation({ watchId: 99 });
    const dispose = watchPosition(() => undefined);

    expect(fake.cleared).toEqual([]);
    dispose();
    expect(fake.cleared).toEqual([99]);
  });

  it('is idempotent — a second dispose cannot clear a recycled id', () => {
    const fake = installGeolocation({ watchId: 4 });
    const dispose = watchPosition(() => undefined);

    dispose();
    dispose();
    dispose();

    expect(fake.cleared).toEqual([4]);
  });

  it('drops emissions that arrive after disposal', () => {
    const fake = installGeolocation();
    const seen: PositionResult[] = [];
    const dispose = watchPosition((result) => seen.push(result));

    fake.succeed(parisRaw());
    dispose();
    fake.succeed(parisRaw());
    fake.fail(positionError(1));

    expect(seen).toHaveLength(1);
  });

  it('does not call clearWatch when the platform returned a non-numeric id', () => {
    const fake = installGeolocation({ watchId: 'not-an-id' });
    const dispose = watchPosition(() => undefined);

    expect(() => dispose()).not.toThrow();
    expect(fake.cleared).toEqual([]);
  });

  it('survives a throwing clearWatch', () => {
    installGeolocation({ throwOnClear: true });
    const dispose = watchPosition(() => undefined);
    expect(() => dispose()).not.toThrow();
  });

  it('survives an API with no clearWatch at all', () => {
    installGeolocation({ omitClear: true });
    const dispose = watchPosition(() => undefined);
    expect(() => dispose()).not.toThrow();
  });
});

describe('distanceBetween — haversine', () => {
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const newYork = { latitude: 40.7128, longitude: -74.006 };
  const losAngeles = { latitude: 34.0522, longitude: -118.2437 };

  /** One degree of longitude at the equator on the module's sphere — the antimeridian oracle. */
  const OneEquatorialDegreeMetres = 111_195;

  it('matches the known Paris↔London great-circle distance (343.5 km ± 1 km)', () => {
    expect(distanceBetween(paris, london)).toBeCloseTo(343_500, -3);
    expect(Math.abs(distanceBetween(paris, london) - 343_500)).toBeLessThan(1_000);
  });

  it('matches the known New York↔Los Angeles distance (3,936 km ± 10 km)', () => {
    expect(Math.abs(distanceBetween(newYork, losAngeles) - 3_936_000)).toBeLessThan(10_000);
  });

  it('is exactly 0 for identical points', () => {
    expect(distanceBetween(paris, paris)).toBe(0);
    expect(distanceBetween({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
  });

  it('is symmetric', () => {
    expect(distanceBetween(paris, london)).toBe(distanceBetween(london, paris));
  });

  it('measures across the antimeridian as the ~111 km it is, not the ~39,900 km long way round', () => {
    const across = distanceBetween({ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 });

    expect(Math.abs(across - OneEquatorialDegreeMetres)).toBeLessThan(10);
    // The same 1° span measured away from the seam — identical, which is the property a naive degree delta
    // (359° instead of 1°) breaks.
    expect(across).toBeCloseTo(
      distanceBetween({ latitude: 0, longitude: 0.5 }, { latitude: 0, longitude: -0.5 }),
      6,
    );
  });

  it('handles a pole-to-pole span and a full equatorial half-circumference', () => {
    const poles = distanceBetween({ latitude: 90, longitude: 0 }, { latitude: -90, longitude: 0 });
    const halfEquator = distanceBetween({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 });

    expect(poles).toBeCloseTo(Math.PI * 6_371_008.8, 3);
    expect(halfEquator).toBeCloseTo(Math.PI * 6_371_008.8, 3);
  });

  it('accepts a Position snapshot directly', () => {
    expect(distanceBetween(ParisSnapshot, ParisSnapshot)).toBe(0);
    expect(distanceBetween(ParisSnapshot, london)).toBeCloseTo(distanceBetween(paris, london), 6);
  });

  it('returns NaN for non-finite input instead of throwing', () => {
    expect(distanceBetween({ latitude: Number.NaN, longitude: 0 }, paris)).toBeNaN();
    expect(distanceBetween(paris, { latitude: 0, longitude: Number.POSITIVE_INFINITY })).toBeNaN();
  });
});

describe('applyPositionResult — reading fold', () => {
  it('records a fix and clears any previous error', () => {
    const failed: GeolocationReading = { status: 'failed', position: null, error: new Error('old') };
    const next = applyPositionResult(failed, { status: 'ok', position: ParisSnapshot });

    expect(next).toEqual({ status: 'ok', position: ParisSnapshot, error: null });
  });

  it('keeps the last known fix through a later failure', () => {
    const located = applyPositionResult(IdleGeolocationReading, { status: 'ok', position: ParisSnapshot });
    const denied = applyPositionResult(located, { status: 'denied' });

    expect(denied.status).toBe('denied');
    expect(denied.position).toEqual(ParisSnapshot);
    expect(denied.error).toBeNull();
  });

  it('carries the error of a failed result and never a stale one', () => {
    const error = new Error('unreadable');
    const failed = applyPositionResult(IdleGeolocationReading, { status: 'failed', error });
    expect(failed.error).toBe(error);

    expect(applyPositionResult(failed, { status: 'timeout' }).error).toBeNull();
  });
});

describe('getGeolocationPermission — delegated to foundation/notifications', () => {
  it('reports the queried state', async () => {
    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'granted' }) } });
    await expect(getGeolocationPermission()).resolves.toBe('granted');
  });

  it('queries under the geolocation name', async () => {
    const asked: unknown[] = [];
    installNavigator({
      permissions: {
        query: (descriptor: unknown) => {
          asked.push(descriptor);
          return Promise.resolve({ state: 'prompt' });
        },
      },
    });

    await expect(getGeolocationPermission()).resolves.toBe('prompt');
    expect(asked).toEqual([{ name: 'geolocation' }]);
  });

  it('reports unsupported — not prompt — where the Permissions API is absent', async () => {
    installNavigator({});
    await expect(getGeolocationPermission()).resolves.toBe('unsupported');
  });

  it('reports unsupported when the query throws for an unknown name (older Safari)', async () => {
    installNavigator({
      permissions: {
        query: () => {
          throw new TypeError('unknown permission name');
        },
      },
    });
    await expect(getGeolocationPermission()).resolves.toBe('unsupported');
  });
});

describe('hostile input — the never-throws contract', () => {
  const garbage: readonly unknown[] = [
    undefined,
    null,
    0,
    '',
    'position',
    Number.NaN,
    [],
    {},
    { coords: null },
    { coords: 'nope' },
    { coords: {} },
    { coords: { latitude: {}, longitude: [], accuracy: 'x' } },
    new Error('not a position'),
  ];

  it('answers every garbage success payload with a defined result and no throw', async () => {
    for (const raw of garbage) {
      const fake = installGeolocation();
      const result = await requestWithSuccess(fake, raw);
      expect(['ok', 'failed']).toContain(result.status);
    }
  });

  it('answers every garbage error payload with a defined result and no throw', async () => {
    for (const raw of garbage) {
      const fake = installGeolocation();
      const result = await requestWithError(fake, raw);
      expect(typeof result.status).toBe('string');
    }
  });

  it('never throws from a watch fed garbage, before or after disposal', () => {
    const fake = installGeolocation();
    const seen: PositionResult[] = [];
    const dispose = watchPosition((result) => seen.push(result));

    expect(() => {
      for (const raw of garbage) {
        fake.succeed(raw);
        fake.fail(raw);
      }
    }).not.toThrow();

    dispose();
    expect(() => fake.succeed(parisRaw())).not.toThrow();
    expect(seen.length).toBeGreaterThan(0);
  });

  it('never throws from distanceBetween fed garbage coordinate objects', () => {
    const nonsense = [
      { latitude: undefined, longitude: null },
      { latitude: 'a', longitude: 'b' },
      { latitude: {}, longitude: [] },
    ] as unknown as ReadonlyArray<{ latitude: number; longitude: number }>;

    for (const point of nonsense) {
      expect(() => distanceBetween(point, ParisSnapshot)).not.toThrow();
      expect(distanceBetween(point, ParisSnapshot)).toBeNaN();
    }
  });
});
