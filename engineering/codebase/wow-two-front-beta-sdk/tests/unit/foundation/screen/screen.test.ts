import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  enterFullscreen,
  exitFullscreen,
  getFullscreenElement,
  getOrientation,
  getOrientationAngle,
  holdWakeLock,
  isFullscreen,
  isFullscreenSupported,
  isOrientationLockSupported,
  lockOrientation,
  onFullscreenChange,
  onOrientationChange,
  requestWakeLock,
  ScreenOrientationLock,
  toggleFullscreen,
  unlockOrientation,
} from '@src/foundation/screen';

// Node project — the slice is capability detection, promise plumbing, and one visibility state machine, so fake
// `document` / `navigator` / `screen` globals are all it needs; no DOM, no renderer. Node ships a real
// `globalThis.navigator` (with none of the members here) and no `document` / `screen` at all, so each test
// installs exactly what its case needs and `afterEach` restores the original descriptors — a leaked stub would
// silently turn the SSR assertions green. The hooks need a renderer and live in `screen.browser.test.ts`.
//
// The wake-lock re-acquire cycle is testable here at all because it lives in `holdWakeLock`, a plain function,
// rather than inside `useWakeLock`. That is the point of the split — see `WakeLock.ts`'s header.

const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalScreen = Object.getOwnPropertyDescriptor(globalThis, 'screen');

/** Replaces a global with `stub` for the duration of a test. */
function installGlobal(name: string, stub: unknown): void {
  Object.defineProperty(globalThis, name, { value: stub, configurable: true, writable: true });
}

/** Removes a global entirely — the genuine SSR shape, which no amount of member-stubbing reproduces. */
function removeGlobal(name: string): void {
  delete (globalThis as Record<string, unknown>)[name];
}

/** Drains the microtask queue so an in-flight request settles before the assertion. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  for (const name of ['document', 'navigator', 'screen']) removeGlobal(name);
  if (originalDocument !== undefined) Object.defineProperty(globalThis, 'document', originalDocument);
  if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  if (originalScreen !== undefined) Object.defineProperty(globalThis, 'screen', originalScreen);
});

/** A `document` stub that records listener traffic and can fire captured handlers. */
function createDocumentStub(overrides: Record<string, unknown> = {}): {
  stub: Record<string, unknown>;
  added: string[];
  removed: string[];
  fire: (type: string) => void;
  count: (type: string) => number;
} {
  const listeners = new Map<string, Set<() => void>>();
  const added: string[] = [];
  const removed: string[] = [];

  const stub: Record<string, unknown> = {
    documentElement: {},
    visibilityState: 'visible',
    addEventListener: (type: string, listener: () => void): void => {
      added.push(type);
      const set = listeners.get(type) ?? new Set<() => void>();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener: (type: string, listener: () => void): void => {
      removed.push(type);
      listeners.get(type)?.delete(listener);
    },
    ...overrides,
  };

  return {
    stub,
    added,
    removed,
    fire: (type: string): void => {
      for (const listener of [...(listeners.get(type) ?? [])]) listener();
    },
    count: (type: string): number => listeners.get(type)?.size ?? 0,
  };
}

/** A stand-in `WakeLockSentinel` whose `released` flag the test flips, exactly as the platform does. */
function createSentinel(): { released: boolean; releaseCalls: number; release: () => Promise<void> } {
  const sentinel = {
    released: false,
    releaseCalls: 0,
    release: (): Promise<void> => {
      sentinel.releaseCalls += 1;
      sentinel.released = true;
      return Promise.resolve();
    },
  };
  return sentinel;
}

/** Installs a `navigator.wakeLock` that hands out fresh sentinels and records every request. */
function installWakeLock(): { requested: string[]; sentinels: ReturnType<typeof createSentinel>[] } {
  const requested: string[] = [];
  const sentinels: ReturnType<typeof createSentinel>[] = [];

  installGlobal('navigator', {
    wakeLock: {
      request: (type: string): Promise<unknown> => {
        requested.push(type);
        const sentinel = createSentinel();
        sentinels.push(sentinel);
        return Promise.resolve(sentinel);
      },
    },
  });

  return { requested, sentinels };
}

/** A `DOMException`-shaped rejection: the platform's real error type, which is not an `Error` instance. */
function domException(name: string, message = 'platform said no'): DOMException {
  return new DOMException(message, name);
}

describe('fullscreen — support + reads', () => {
  it('answers unsupported under SSR rather than throwing', async () => {
    removeGlobal('document');

    expect(typeof document).toBe('undefined');
    expect(() => isFullscreen()).not.toThrow();
    expect(isFullscreen()).toBe(false);
    expect(getFullscreenElement()).toBeNull();
    expect(isFullscreenSupported()).toBe(false);
    await expect(enterFullscreen()).resolves.toEqual({ status: 'unsupported' });
    await expect(exitFullscreen()).resolves.toEqual({ status: 'unsupported' });
  });

  it('reports unsupported when the document exposes neither the standard nor the prefixed method', async () => {
    installGlobal('document', createDocumentStub({ documentElement: {} }).stub);

    expect(isFullscreenSupported()).toBe(false);
    await expect(enterFullscreen()).resolves.toEqual({ status: 'unsupported' });
  });

  it('reports supported off the prefixed method alone', () => {
    const element = { webkitRequestFullscreen: (): void => undefined };
    installGlobal('document', createDocumentStub({ documentElement: element }).stub);

    expect(isFullscreenSupported()).toBe(true);
  });

  it('prefers the standard fullscreen element and falls back to the prefixed one', () => {
    const standard = { id: 'standard' };
    const prefixed = { id: 'prefixed' };

    installGlobal(
      'document',
      createDocumentStub({ fullscreenElement: standard, webkitFullscreenElement: prefixed }).stub,
    );
    expect(getFullscreenElement()).toBe(standard);
    expect(isFullscreen()).toBe(true);

    installGlobal('document', createDocumentStub({ fullscreenElement: null, webkitFullscreenElement: prefixed }).stub);
    expect(getFullscreenElement()).toBe(prefixed);
    expect(isFullscreen()).toBe(true);

    installGlobal('document', createDocumentStub({ fullscreenElement: null }).stub);
    expect(getFullscreenElement()).toBeNull();
    expect(isFullscreen()).toBe(false);
  });
});

describe('fullscreen — entering', () => {
  it('calls the standard requestFullscreen on the document root by default', async () => {
    const calls: unknown[] = [];
    const root = {
      requestFullscreen: function (this: unknown): Promise<void> {
        calls.push(this);
        return Promise.resolve();
      },
    };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    await expect(enterFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(calls).toEqual([root]);
  });

  it('uses the WebKit-prefixed request when the standard method is absent', async () => {
    const calls: string[] = [];
    // Safari's prefixed form returns `undefined`, not a promise — the `await` must tolerate that.
    const element = {
      webkitRequestFullscreen: (): void => {
        calls.push('webkit');
      },
    };
    installGlobal('document', createDocumentStub({ documentElement: element }).stub);

    await expect(enterFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(calls).toEqual(['webkit']);
  });

  it('presents an explicitly passed element instead of the root', async () => {
    const calls: unknown[] = [];
    const target = {
      requestFullscreen: function (this: unknown): Promise<void> {
        calls.push(this);
        return Promise.resolve();
      },
    };
    installGlobal('document', createDocumentStub().stub);

    await expect(enterFullscreen(target as unknown as Element)).resolves.toEqual({ status: 'ok' });
    expect(calls).toEqual([target]);
  });

  it('maps a TypeError rejection to requires-gesture, not failed', async () => {
    const root = { requestFullscreen: (): Promise<void> => Promise.reject(new TypeError('permissions check failed')) };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    const result = await enterFullscreen();

    expect(result.status).toBe('requires-gesture');
    if (result.status !== 'requires-gesture') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
  });

  it('maps a gesture-worded rejection to requires-gesture whatever its type', async () => {
    const root = {
      requestFullscreen: (): Promise<void> =>
        Promise.reject(domException('InvalidStateError', 'API can only be initiated by a user gesture.')),
    };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    await expect(enterFullscreen()).resolves.toMatchObject({ status: 'requires-gesture' });
  });

  it('maps a generic rejection to failed, carrying the normalized error', async () => {
    const boom = new Error('boom');
    const root = { requestFullscreen: (): Promise<void> => Promise.reject(boom) };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    const result = await enterFullscreen();

    expect(result).toEqual({ status: 'failed', error: boom });
  });

  it('maps a NotAllowedError to denied', async () => {
    const root = { requestFullscreen: (): Promise<void> => Promise.reject(domException('NotAllowedError')) };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    await expect(enterFullscreen()).resolves.toMatchObject({ status: 'denied' });
  });

  it('resolves rather than rejecting when requestFullscreen throws synchronously', async () => {
    const root = {
      requestFullscreen: (): Promise<void> => {
        throw new Error('sync throw');
      },
    };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    await expect(enterFullscreen()).resolves.toMatchObject({ status: 'failed' });
  });

  it('normalizes a non-Error rejection into an Error', async () => {
    const root = { requestFullscreen: (): Promise<void> => Promise.reject('nope') };
    installGlobal('document', createDocumentStub({ documentElement: root }).stub);

    const result = await enterFullscreen();

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('nope');
  });
});

describe('fullscreen — exiting + toggling', () => {
  it('calls the standard exitFullscreen when something is presented', async () => {
    let called = 0;
    installGlobal(
      'document',
      createDocumentStub({
        fullscreenElement: { id: 'x' },
        exitFullscreen: (): Promise<void> => {
          called += 1;
          return Promise.resolve();
        },
      }).stub,
    );

    await expect(exitFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(called).toBe(1);
  });

  it('uses the WebKit-prefixed exit when the standard method is absent', async () => {
    let called = 0;
    installGlobal(
      'document',
      createDocumentStub({
        webkitFullscreenElement: { id: 'x' },
        webkitExitFullscreen: (): void => {
          called += 1;
        },
      }).stub,
    );

    await expect(exitFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(called).toBe(1);
  });

  it('is idempotent — exiting when nothing is presented resolves ok without calling the platform', async () => {
    let called = 0;
    installGlobal(
      'document',
      createDocumentStub({
        fullscreenElement: null,
        exitFullscreen: (): Promise<void> => {
          called += 1;
          return Promise.resolve();
        },
      }).stub,
    );

    await expect(exitFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(called).toBe(0);
  });

  it('toggles into fullscreen when out, and out when in', async () => {
    const entered: string[] = [];
    const exited: string[] = [];
    const root = {
      requestFullscreen: (): Promise<void> => {
        entered.push('enter');
        return Promise.resolve();
      },
    };

    installGlobal('document', createDocumentStub({ documentElement: root, fullscreenElement: null }).stub);
    await expect(toggleFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(entered).toEqual(['enter']);

    installGlobal(
      'document',
      createDocumentStub({
        documentElement: root,
        fullscreenElement: { id: 'x' },
        exitFullscreen: (): Promise<void> => {
          exited.push('exit');
          return Promise.resolve();
        },
      }).stub,
    );
    await expect(toggleFullscreen()).resolves.toEqual({ status: 'ok' });
    expect(exited).toEqual(['exit']);
    expect(entered).toEqual(['enter']);
  });
});

describe('fullscreen — change subscription', () => {
  it('subscribes to both the standard and prefixed events, and removes both', () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);

    const unsubscribe = onFullscreenChange(() => undefined);

    expect(doc.added).toEqual(['fullscreenchange', 'webkitfullscreenchange']);
    expect(doc.count('fullscreenchange')).toBe(1);
    expect(doc.count('webkitfullscreenchange')).toBe(1);

    unsubscribe();

    expect(doc.removed).toEqual(['fullscreenchange', 'webkitfullscreenchange']);
    expect(doc.count('fullscreenchange')).toBe(0);
    expect(doc.count('webkitfullscreenchange')).toBe(0);
  });

  it('notifies the listener on either event spelling', () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const listener = vi.fn();

    const unsubscribe = onFullscreenChange(listener);
    doc.fire('fullscreenchange');
    doc.fire('webkitfullscreenchange');
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns a no-op unsubscribe under SSR', () => {
    removeGlobal('document');

    const unsubscribe = onFullscreenChange(() => undefined);

    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('wake lock — one request', () => {
  it('reports unsupported under SSR', async () => {
    removeGlobal('navigator');

    await expect(requestWakeLock()).resolves.toEqual({ status: 'unsupported' });
  });

  it('reports unsupported when navigator exposes no wakeLock', async () => {
    installGlobal('navigator', {});

    await expect(requestWakeLock()).resolves.toEqual({ status: 'unsupported' });
  });

  it('resolves ok with a handle that reads the sentinel live', async () => {
    const lock = installWakeLock();

    const result = await requestWakeLock();

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable — narrowing guard');
    expect(lock.requested).toEqual(['screen']);
    expect(result.value.type).toBe('screen');
    expect(result.value.released).toBe(false);

    // The platform flips the flag on its own; the handle must not have snapshotted it.
    const sentinel = lock.sentinels.at(0);
    expect(sentinel).toBeDefined();
    if (sentinel !== undefined) sentinel.released = true;
    expect(result.value.released).toBe(true);
  });

  it('releases through to the sentinel and swallows a rejected release', async () => {
    installGlobal('navigator', {
      wakeLock: {
        request: (): Promise<unknown> =>
          Promise.resolve({
            released: false,
            release: (): Promise<void> => Promise.reject(new Error('already gone')),
          }),
      },
    });

    const result = await requestWakeLock();

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable — narrowing guard');
    await expect(result.value.release()).resolves.toBeUndefined();
  });

  it('maps a NotAllowedError to denied', async () => {
    installGlobal('navigator', {
      wakeLock: { request: (): Promise<unknown> => Promise.reject(domException('NotAllowedError')) },
    });

    const result = await requestWakeLock();

    expect(result.status).toBe('denied');
    if (result.status !== 'denied') throw new Error('unreachable — narrowing guard');
    expect(result.error.name).toBe('NotAllowedError');
  });

  it('maps any other rejection to failed', async () => {
    const boom = new Error('boom');
    installGlobal('navigator', { wakeLock: { request: (): Promise<unknown> => Promise.reject(boom) } });

    await expect(requestWakeLock()).resolves.toEqual({ status: 'failed', error: boom });
  });
});

describe('wake lock — holding across visibility changes', () => {
  it('acquires immediately and reports held', async () => {
    installGlobal('document', createDocumentStub().stub);
    const lock = installWakeLock();

    const hold = holdWakeLock();
    await flush();

    expect(lock.requested).toEqual(['screen']);
    expect(hold.state).toEqual({ held: true, status: 'ok', error: null });

    hold.release();
  });

  it('RE-ACQUIRES the lock after the page returns to visible', async () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const lock = installWakeLock();

    const hold = holdWakeLock();
    await flush();
    expect(lock.requested).toHaveLength(1);
    expect(hold.state.held).toBe(true);

    // The platform releases the lock on its own when the page is hidden, and never gives it back.
    const first = lock.sentinels.at(0);
    expect(first).toBeDefined();
    if (first !== undefined) first.released = true;
    doc.stub.visibilityState = 'hidden';
    doc.fire('visibilitychange');
    await flush();

    expect(hold.state.held).toBe(false);
    expect(lock.requested).toHaveLength(1);

    // Back to visible — the whole reason this module exists.
    doc.stub.visibilityState = 'visible';
    doc.fire('visibilitychange');
    await flush();

    expect(lock.requested).toEqual(['screen', 'screen']);
    expect(hold.state).toEqual({ held: true, status: 'ok', error: null });

    hold.release();
  });

  it('does not stack a second lock when the current one is still live', async () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const lock = installWakeLock();

    const hold = holdWakeLock();
    await flush();

    // A `visible` → `visible` notification with the lock still held must be a no-op.
    doc.fire('visibilitychange');
    doc.fire('visibilitychange');
    await flush();

    expect(lock.requested).toHaveLength(1);

    hold.release();
  });

  it('publishes each transition through onChange', async () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const lock = installWakeLock();
    const onChange = vi.fn();

    const hold = holdWakeLock({ onChange });
    await flush();
    expect(onChange).toHaveBeenLastCalledWith({ held: true, status: 'ok', error: null });

    const first = lock.sentinels.at(0);
    if (first !== undefined) first.released = true;
    doc.stub.visibilityState = 'hidden';
    doc.fire('visibilitychange');
    await flush();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ held: false }));

    hold.release();
  });

  it('keeps holding when the consumer onChange throws', async () => {
    installGlobal('document', createDocumentStub().stub);
    installWakeLock();
    const onChange = vi.fn(() => {
      throw new Error('listener exploded');
    });

    const hold = holdWakeLock({ onChange });
    await flush();

    expect(onChange).toHaveBeenCalled();
    expect(hold.state.held).toBe(true);

    hold.release();
  });

  it('releases the lock and unsubscribes on release, idempotently', async () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const lock = installWakeLock();

    const hold = holdWakeLock();
    await flush();
    expect(doc.count('visibilitychange')).toBe(1);

    hold.release();
    hold.release();
    await flush();

    expect(doc.count('visibilitychange')).toBe(0);
    const sentinel = lock.sentinels.at(0);
    expect(sentinel?.releaseCalls).toBe(1);
    expect(sentinel?.released).toBe(true);
  });

  it('releases a lock that lands after the hold was already released', async () => {
    const doc = createDocumentStub();
    installGlobal('document', doc.stub);
    const lock = installWakeLock();

    const hold = holdWakeLock();
    // Released while the very first request is still in flight.
    hold.release();
    await flush();

    const sentinel = lock.sentinels.at(0);
    expect(sentinel?.released).toBe(true);
    expect(hold.state.held).toBe(false);
  });

  it('reports unsupported without a wakeLock API, and stops there', async () => {
    installGlobal('document', createDocumentStub().stub);
    installGlobal('navigator', {});

    const hold = holdWakeLock();
    await flush();

    expect(hold.state).toEqual({ held: false, status: 'unsupported', error: null });

    hold.release();
  });

  it('works with no document to subscribe to — SSR never throws', async () => {
    removeGlobal('document');
    installWakeLock();

    const hold = holdWakeLock();
    await flush();

    expect(hold.state.held).toBe(true);
    expect(() => hold.release()).not.toThrow();
  });
});

describe('orientation', () => {
  it('answers empty under SSR rather than throwing', async () => {
    removeGlobal('screen');

    expect(getOrientation()).toBeNull();
    expect(getOrientationAngle()).toBeNull();
    expect(isOrientationLockSupported()).toBe(false);
    expect(unlockOrientation()).toEqual({ status: 'unsupported' });
    await expect(lockOrientation(ScreenOrientationLock.Portrait)).resolves.toEqual({ status: 'unsupported' });
  });

  it('reads the current orientation and angle', () => {
    installGlobal('screen', { orientation: { type: 'landscape-primary', angle: 90 } });

    expect(getOrientation()).toBe('landscape-primary');
    expect(getOrientationAngle()).toBe(90);
  });

  it('rejects an orientation value the platform is not specified to report', () => {
    installGlobal('screen', { orientation: { type: 'sideways', angle: Number.NaN } });

    expect(getOrientation()).toBeNull();
    expect(getOrientationAngle()).toBeNull();
  });

  it('locks successfully, forwarding the requested orientation', async () => {
    const locked: string[] = [];
    installGlobal('screen', {
      orientation: {
        lock: (orientation: string): Promise<void> => {
          locked.push(orientation);
          return Promise.resolve();
        },
      },
    });

    expect(isOrientationLockSupported()).toBe(true);
    await expect(lockOrientation(ScreenOrientationLock.LandscapePrimary)).resolves.toEqual({ status: 'ok' });
    expect(locked).toEqual(['landscape-primary']);
  });

  it('maps a fullscreen-worded rejection to requires-fullscreen, not failed', async () => {
    installGlobal('screen', {
      orientation: {
        lock: (): Promise<void> =>
          Promise.reject(domException('InvalidStateError', 'The page needs to be fullscreen to lock orientation.')),
      },
    });

    const result = await lockOrientation(ScreenOrientationLock.Landscape);

    expect(result.status).toBe('requires-fullscreen');
    expect(result.status).not.toBe('failed');
  });

  it('maps a SecurityError to requires-fullscreen', async () => {
    installGlobal('screen', {
      orientation: { lock: (): Promise<void> => Promise.reject(domException('SecurityError')) },
    });

    await expect(lockOrientation(ScreenOrientationLock.Portrait)).resolves.toMatchObject({
      status: 'requires-fullscreen',
    });
  });

  it('maps a NotSupportedError to unsupported, which carries no error', async () => {
    installGlobal('screen', {
      orientation: {
        lock: (): Promise<void> => Promise.reject(domException('NotSupportedError', 'not available on this device')),
      },
    });

    await expect(lockOrientation(ScreenOrientationLock.Natural)).resolves.toEqual({ status: 'unsupported' });
  });

  it('maps a NotAllowedError to denied', async () => {
    installGlobal('screen', {
      orientation: { lock: (): Promise<void> => Promise.reject(domException('NotAllowedError')) },
    });

    await expect(lockOrientation(ScreenOrientationLock.Any)).resolves.toMatchObject({ status: 'denied' });
  });

  it('maps anything else to failed', async () => {
    const boom = new Error('boom');
    installGlobal('screen', { orientation: { lock: (): Promise<void> => Promise.reject(boom) } });

    await expect(lockOrientation(ScreenOrientationLock.Portrait)).resolves.toEqual({ status: 'failed', error: boom });
  });

  it('unlocks synchronously, and reports a throwing unlock as failed', () => {
    let called = 0;
    installGlobal('screen', {
      orientation: {
        unlock: (): void => {
          called += 1;
        },
      },
    });
    expect(unlockOrientation()).toEqual({ status: 'ok' });
    expect(called).toBe(1);

    installGlobal('screen', {
      orientation: {
        unlock: (): void => {
          throw new Error('nope');
        },
      },
    });
    expect(unlockOrientation()).toMatchObject({ status: 'failed' });
  });

  it('subscribes and unsubscribes on the orientation object', () => {
    const listeners = new Set<() => void>();
    installGlobal('screen', {
      orientation: {
        addEventListener: (_type: string, listener: () => void): void => {
          listeners.add(listener);
        },
        removeEventListener: (_type: string, listener: () => void): void => {
          listeners.delete(listener);
        },
      },
    });

    const unsubscribe = onOrientationChange(() => undefined);
    expect(listeners.size).toBe(1);

    unsubscribe();
    expect(listeners.size).toBe(0);
  });

  it('returns a no-op unsubscribe where the API is absent', () => {
    removeGlobal('screen');

    expect(() => onOrientationChange(() => undefined)()).not.toThrow();
  });
});

describe('hostile inputs — nothing throws', () => {
  /** Every member read blows up, the way a broken polyfill or a revoked cross-origin document behaves. */
  function throwingStub(keys: readonly string[]): Record<string, unknown> {
    const stub: Record<string, unknown> = {};
    for (const key of keys) {
      Object.defineProperty(stub, key, {
        get: (): never => {
          throw new Error(`hostile read: ${key}`);
        },
        configurable: true,
      });
    }
    return stub;
  }

  it('survives a document whose every member read throws', async () => {
    installGlobal(
      'document',
      throwingStub([
        'documentElement',
        'fullscreenElement',
        'webkitFullscreenElement',
        'exitFullscreen',
        'webkitExitFullscreen',
        'addEventListener',
        'removeEventListener',
        'visibilityState',
      ]),
    );

    expect(() => isFullscreen()).not.toThrow();
    expect(getFullscreenElement()).toBeNull();
    expect(isFullscreenSupported()).toBe(false);
    expect(() => onFullscreenChange(() => undefined)()).not.toThrow();
    await expect(enterFullscreen()).resolves.toEqual({ status: 'unsupported' });
    await expect(exitFullscreen()).resolves.toEqual({ status: 'unsupported' });
  });

  it('survives a navigator and screen whose members throw', async () => {
    installGlobal('navigator', throwingStub(['wakeLock']));
    installGlobal('screen', throwingStub(['orientation']));

    await expect(requestWakeLock()).resolves.toEqual({ status: 'unsupported' });
    expect(getOrientation()).toBeNull();
    expect(getOrientationAngle()).toBeNull();
    expect(isOrientationLockSupported()).toBe(false);
    expect(unlockOrientation()).toEqual({ status: 'unsupported' });
    await expect(lockOrientation(ScreenOrientationLock.Any)).resolves.toEqual({ status: 'unsupported' });
  });

  it('survives primitives and nonsense where the platform objects should be', async () => {
    installGlobal('document', 42);
    installGlobal('navigator', 'not-a-navigator');
    installGlobal('screen', null);

    expect(() => isFullscreen()).not.toThrow();
    await expect(enterFullscreen()).resolves.toEqual({ status: 'unsupported' });
    await expect(requestWakeLock()).resolves.toEqual({ status: 'unsupported' });
    // A value outside the documented union, as untyped JS callers will eventually pass.
    await expect(lockOrientation('sideways' as ScreenOrientationLock)).resolves.toEqual({ status: 'unsupported' });
    expect(unlockOrientation()).toEqual({ status: 'unsupported' });
  });

  it('survives a wakeLock whose request resolves to junk', async () => {
    installGlobal('navigator', { wakeLock: { request: (): Promise<unknown> => Promise.resolve(null) } });

    const result = await requestWakeLock();

    expect(result.status).toBe('ok');
    if (result.status !== 'ok') throw new Error('unreachable — narrowing guard');
    expect(result.value.released).toBe(false);
    await expect(result.value.release()).resolves.toBeUndefined();
  });
});
