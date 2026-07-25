import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  canNotify,
  getNotificationPermission,
  notify,
  queryPermission,
  requestNotificationPermission,
  type NotifyOptions,
} from '@src/foundation/notifications';

// Node project — the whole non-React surface is capability detection, a constructor call, and promise plumbing,
// so fake globals are all it needs; no DOM, no renderer. Node ships no `Notification` at all (which is exactly
// the SSR shape) and a real `globalThis.navigator` with no `permissions`, so each test installs only what its
// case needs and `afterEach` puts the environment back — a leaked stub would silently turn the SSR assertions
// green. The two hooks need a renderer and live in `useNotificationPermission.browser.test.ts`.

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

/** A stand-in for a shown notification. Extends the real `EventTarget`, so click / close dispatch for real. */
class FakeNotification extends EventTarget {
  /** How many times the module (or the test) closed it. */
  closeCount = 0;

  constructor(
    readonly title: unknown,
    readonly options: unknown,
  ) {
    super();
  }

  /** Mirrors the platform: closing fires a `close` event, which is what cancels the auto-close timer. */
  close(): void {
    this.closeCount += 1;
    this.dispatchEvent(new Event('close'));
  }
}

/** How a test wants the fake `Notification` global to behave. */
interface NotificationStubConfig {
  /** What the static `permission` answers. Defaults to `'granted'`. */
  readonly permission?: unknown;
  /** Makes reading the static `permission` throw — the "present but unusable" implementation. */
  readonly permissionThrows?: boolean;
  /** Installs a static `requestPermission`. Omitted → the static is absent entirely. */
  readonly requestPermission?: (callback?: (permission: string) => void) => unknown;
  /** Makes construction throw this value. */
  readonly constructThrows?: unknown;
}

/** Installs a fake `Notification` global for the duration of a test and records every instance constructed. */
function installNotification(config: NotificationStubConfig = {}): { created: FakeNotification[] } {
  const created: FakeNotification[] = [];

  class StubNotification extends FakeNotification {
    constructor(title: unknown, options?: unknown) {
      super(title, options);
      if (config.constructThrows !== undefined) throw config.constructThrows;
      created.push(this);
    }
  }

  Object.defineProperty(
    StubNotification,
    'permission',
    config.permissionThrows === true
      ? {
          get(): never {
            throw new Error('permission unreadable');
          },
          configurable: true,
        }
      : // Key presence, not `??` — a test that explicitly asks for `permission: undefined` is testing exactly
        // the off-spec value a `??` default would swallow.
        { value: 'permission' in config ? config.permission : 'granted', configurable: true },
  );

  if (config.requestPermission !== undefined) {
    Object.defineProperty(StubNotification, 'requestPermission', {
      value: config.requestPermission,
      configurable: true,
    });
  }

  Object.defineProperty(globalThis, 'Notification', { value: StubNotification, configurable: true, writable: true });
  return { created };
}

/** Installs a `Notification` global whose very read throws — the hostile-getter case behind every `typeof`. */
function installThrowingNotificationGlobal(): void {
  Object.defineProperty(globalThis, 'Notification', {
    get(): never {
      throw new Error('blocked by extension');
    },
    configurable: true,
  });
}

/** Removes `Notification` entirely — the genuine SSR / unsupported-browser shape. */
function removeNotification(): void {
  delete (globalThis as { Notification?: unknown }).Notification;
}

/** The one member of `navigator` this slice touches. */
interface NavigatorStub {
  permissions?: { query?: (descriptor: unknown) => unknown };
}

/** Replaces `globalThis.navigator` with `stub` for the duration of a test. */
function installNavigator(stub: NavigatorStub): void {
  Object.defineProperty(globalThis, 'navigator', { value: stub, configurable: true, writable: true });
}

/** Removes `navigator` entirely — the genuine SSR shape, which no amount of member-stubbing reproduces. */
function removeNavigator(): void {
  delete (globalThis as { navigator?: unknown }).navigator;
}

/** Installs a fake browser `window` exposing only `focus`, and returns the spy the click path should call. */
function installWindow(): ReturnType<typeof vi.fn> {
  const focus = vi.fn();
  (globalThis as { window?: unknown }).window = { focus };
  return focus;
}

/** Removes the fake `window` — node has none, so this is also the restore. */
function removeWindow(): void {
  delete (globalThis as { window?: unknown }).window;
}

/** Narrows a recorded instance, failing loudly instead of returning `undefined` under `noUncheckedIndexedAccess`. */
function firstCreated(created: FakeNotification[]): FakeNotification {
  const instance = created.at(0);
  if (instance === undefined) throw new Error('expected a notification to have been constructed');
  return instance;
}

/** Narrows a `shown` result to its notification handle. */
function shownNotification(result: ReturnType<typeof notify>): FakeNotification {
  if (result.status !== 'shown') throw new Error(`expected shown, got ${result.status}`);
  return result.notification as unknown as FakeNotification;
}

afterEach(() => {
  vi.useRealTimers();
  removeNotification();
  removeWindow();
  removeNavigator();
  if (originalNavigator !== undefined) Object.defineProperty(globalThis, 'navigator', originalNavigator);
});

describe('getNotificationPermission', () => {
  it('returns unsupported under SSR — no Notification at all', () => {
    removeNotification();
    expect(typeof Notification).toBe('undefined');
    expect(() => getNotificationPermission()).not.toThrow();
    expect(getNotificationPermission()).toBe('unsupported');
  });

  it('reports each platform state', () => {
    installNotification({ permission: 'granted' });
    expect(getNotificationPermission()).toBe('granted');

    installNotification({ permission: 'denied' });
    expect(getNotificationPermission()).toBe('denied');

    installNotification({ permission: 'default' });
    expect(getNotificationPermission()).toBe('default');
  });

  it('degrades an off-spec permission value to default', () => {
    installNotification({ permission: 'maybe' });
    expect(getNotificationPermission()).toBe('default');

    installNotification({ permission: undefined });
    expect(getNotificationPermission()).toBe('default');

    installNotification({ permission: 42 });
    expect(getNotificationPermission()).toBe('default');
  });

  it('returns unsupported rather than throwing when the permission read throws', () => {
    installNotification({ permissionThrows: true });
    expect(() => getNotificationPermission()).not.toThrow();
    expect(getNotificationPermission()).toBe('unsupported');
  });

  it('returns unsupported rather than throwing when the global itself throws on read', () => {
    installThrowingNotificationGlobal();
    expect(() => getNotificationPermission()).not.toThrow();
    expect(getNotificationPermission()).toBe('unsupported');
  });

  it('returns unsupported when Notification is present but not constructible', () => {
    Object.defineProperty(globalThis, 'Notification', {
      value: { permission: 'granted' },
      configurable: true,
      writable: true,
    });
    expect(getNotificationPermission()).toBe('unsupported');
  });
});

describe('requestNotificationPermission', () => {
  it('resolves unsupported under SSR', async () => {
    removeNotification();
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
  });

  it('resolves unsupported when the API exists but requestPermission does not', async () => {
    installNotification({ permission: 'default' });
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
  });

  it('adopts the modern promise form', async () => {
    installNotification({ permission: 'default', requestPermission: () => Promise.resolve('granted') });
    await expect(requestNotificationPermission()).resolves.toBe('granted');
  });

  it('adopts the legacy callback form — the pre-16 Safari shape', async () => {
    installNotification({
      permission: 'default',
      // Returns undefined, answers through the callback, and does so asynchronously as the real one does.
      requestPermission: (callback) => {
        setTimeout(() => callback?.('denied'), 0);
        return undefined;
      },
    });

    await expect(requestNotificationPermission()).resolves.toBe('denied');
  });

  it('settles once when an implementation honours BOTH the callback and the promise', async () => {
    const seen: string[] = [];
    installNotification({
      permission: 'default',
      requestPermission: (callback) => {
        callback?.('granted');
        return Promise.resolve('granted');
      },
    });

    seen.push(await requestNotificationPermission());
    expect(seen).toEqual(['granted']);
  });

  it('accepts a synchronous string return', async () => {
    installNotification({ permission: 'default', requestPermission: () => 'granted' });
    await expect(requestNotificationPermission()).resolves.toBe('granted');
  });

  it('normalizes an off-spec answer to default', async () => {
    installNotification({ permission: 'default', requestPermission: () => Promise.resolve('sure') });
    await expect(requestNotificationPermission()).resolves.toBe('default');
  });

  it('falls back to the standing grant when the prompt rejects', async () => {
    installNotification({ permission: 'denied', requestPermission: () => Promise.reject(new Error('insecure')) });
    await expect(requestNotificationPermission()).resolves.toBe('denied');
  });

  it('falls back to the standing grant when the prompt throws synchronously', async () => {
    installNotification({
      permission: 'granted',
      requestPermission: () => {
        throw new Error('sync throw');
      },
    });

    await expect(requestNotificationPermission()).resolves.toBe('granted');
  });

  it('never rejects for any of the failure shapes', async () => {
    installNotification({ permissionThrows: true, requestPermission: () => Promise.reject('nope') });
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
  });
});

describe('canNotify', () => {
  it('is false under SSR', () => {
    removeNotification();
    expect(() => canNotify()).not.toThrow();
    expect(canNotify()).toBe(false);
  });

  it('is true only for a granted permission', () => {
    installNotification({ permission: 'granted' });
    expect(canNotify()).toBe(true);

    installNotification({ permission: 'default' });
    expect(canNotify()).toBe(false);

    installNotification({ permission: 'denied' });
    expect(canNotify()).toBe(false);
  });
});

describe('notify', () => {
  it('resolves unsupported under SSR', () => {
    removeNotification();
    expect(() => notify('T')).not.toThrow();
    expect(notify('T')).toEqual({ status: 'unsupported' });
  });

  it('reports denied for a refused grant', () => {
    installNotification({ permission: 'denied' });
    expect(notify('T')).toEqual({ status: 'denied' });
  });

  it('reports denied for an undecided grant — it never prompts on its own', () => {
    const stub = installNotification({ permission: 'default' });
    expect(notify('T')).toEqual({ status: 'denied' });
    expect(stub.created).toHaveLength(0);
  });

  it('shows the notification and returns the live handle', () => {
    const stub = installNotification({ permission: 'granted' });

    const result = notify('Build finished');

    expect(result.status).toBe('shown');
    expect(stub.created).toHaveLength(1);
    expect(firstCreated(stub.created).title).toBe('Build finished');
    expect(shownNotification(result)).toBe(firstCreated(stub.created));
  });

  it('forwards only the platform members the caller set', () => {
    const stub = installNotification({ permission: 'granted' });

    notify('T', { body: 'B', tag: 'deploy', data: { id: 7 }, silent: true, requireInteraction: false });

    const options = firstCreated(stub.created).options as Record<string, unknown>;
    expect(Object.keys(options).sort()).toEqual(['body', 'data', 'requireInteraction', 'silent', 'tag']);
    expect(options.data).toEqual({ id: 7 });
  });

  it('never forwards its own conveniences to the constructor', () => {
    const stub = installNotification({ permission: 'granted' });

    notify('T', { body: 'B', autoCloseMs: 100, onClick: () => undefined });

    expect(Object.keys(firstCreated(stub.created).options as object)).toEqual(['body']);
  });

  it('reports failed with the normalized error when construction throws', () => {
    const boom = new Error('service worker required');
    installNotification({ permission: 'granted', constructThrows: boom });

    const result = notify('T');

    expect(result).toEqual({ status: 'failed', error: boom });
  });

  it('normalizes a non-Error throw into an Error', () => {
    installNotification({ permission: 'granted', constructThrows: 'nope' });

    const result = notify('T');

    expect(result.status).toBe('failed');
    if (result.status !== 'failed') throw new Error('unreachable — narrowing guard');
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('nope');
  });
});

describe('notify — click convenience', () => {
  it('calls onClick and focuses the window', () => {
    installNotification({ permission: 'granted' });
    const focus = installWindow();
    const onClick = vi.fn();

    const notification = shownNotification(notify('T', { onClick }));
    notification.dispatchEvent(new Event('click'));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('focuses the window even with no onClick, and does not throw without a window', () => {
    installNotification({ permission: 'granted' });

    const notification = shownNotification(notify('T'));
    expect(typeof window).toBe('undefined');
    expect(() => notification.dispatchEvent(new Event('click'))).not.toThrow();
  });

  it('absorbs a throw from the consumer onClick', () => {
    installNotification({ permission: 'granted' });
    installWindow();
    const onClick = vi.fn(() => {
      throw new Error('handler exploded');
    });

    const notification = shownNotification(notify('T', { onClick }));

    expect(() => notification.dispatchEvent(new Event('click'))).not.toThrow();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('notify — autoCloseMs', () => {
  it('closes the notification after the delay', () => {
    vi.useFakeTimers();
    installNotification({ permission: 'granted' });

    const notification = shownNotification(notify('T', { autoCloseMs: 5_000 }));

    vi.advanceTimersByTime(4_999);
    expect(notification.closeCount).toBe(0);

    vi.advanceTimersByTime(1);
    expect(notification.closeCount).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timer when the notification is closed first — no dangling timeout', () => {
    vi.useFakeTimers();
    installNotification({ permission: 'granted' });

    const notification = shownNotification(notify('T', { autoCloseMs: 5_000 }));
    expect(vi.getTimerCount()).toBe(1);

    notification.close();
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(10_000);
    expect(notification.closeCount).toBe(1);
  });

  it('clears the timer when the notification is clicked first', () => {
    vi.useFakeTimers();
    installNotification({ permission: 'granted' });

    const notification = shownNotification(notify('T', { autoCloseMs: 5_000 }));
    notification.dispatchEvent(new Event('click'));

    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10_000);
    expect(notification.closeCount).toBe(0);
  });

  it('schedules nothing without autoCloseMs, or for a non-finite / negative value', () => {
    vi.useFakeTimers();
    installNotification({ permission: 'granted' });

    notify('T');
    notify('T', { autoCloseMs: Number.NaN });
    notify('T', { autoCloseMs: Number.POSITIVE_INFINITY });
    notify('T', { autoCloseMs: -1 });

    expect(vi.getTimerCount()).toBe(0);
  });

  it('survives a close() that throws', () => {
    vi.useFakeTimers();
    installNotification({ permission: 'granted' });

    const notification = shownNotification(notify('T', { autoCloseMs: 10 }));
    notification.close = () => {
      throw new Error('already gone');
    };

    expect(() => vi.advanceTimersByTime(10)).not.toThrow();
  });
});

describe('queryPermission', () => {
  it('resolves unsupported under SSR — no navigator at all', async () => {
    removeNavigator();
    expect(typeof navigator).toBe('undefined');
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });

  it('resolves unsupported when navigator exposes no permissions', async () => {
    installNavigator({});
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });

  it('resolves unsupported when permissions exposes no query', async () => {
    installNavigator({ permissions: {} });
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });

  it('reports each platform state', async () => {
    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'granted' }) } });
    await expect(queryPermission('notifications')).resolves.toBe('granted');

    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'denied' }) } });
    await expect(queryPermission('notifications')).resolves.toBe('denied');

    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'prompt' }) } });
    await expect(queryPermission('geolocation')).resolves.toBe('prompt');
  });

  it('hands the platform a { name } descriptor', async () => {
    const seen: unknown[] = [];
    installNavigator({
      permissions: {
        query: (descriptor: unknown) => {
          seen.push(descriptor);
          return Promise.resolve({ state: 'granted' });
        },
      },
    });

    await queryPermission('notifications');
    expect(seen).toEqual([{ name: 'notifications' }]);
  });

  it('resolves unsupported when query throws synchronously — the Safari unknown-name shape', async () => {
    installNavigator({
      permissions: {
        query: () => {
          throw new TypeError("'clipboard-read' is not a valid enum value");
        },
      },
    });

    await expect(queryPermission('clipboard-read')).resolves.toBe('unsupported');
  });

  it('resolves unsupported when query rejects', async () => {
    installNavigator({ permissions: { query: () => Promise.reject(new Error('nope')) } });
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });

  it('resolves unsupported for an off-spec or unreadable state', async () => {
    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'maybe' }) } });
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');

    installNavigator({ permissions: { query: () => Promise.resolve(null) } });
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');

    installNavigator({
      permissions: {
        query: () =>
          Promise.resolve({
            get state(): never {
              throw new Error('unreadable');
            },
          }),
      },
    });
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });
});

describe('nothing throws — hostile input', () => {
  it('takes any title without throwing', () => {
    installNotification({ permission: 'granted' });

    const hostile: unknown[] = [undefined, null, 0, Number.NaN, Symbol('t'), {}, [], () => undefined];
    for (const title of hostile) {
      expect(() => notify(title as string)).not.toThrow();
    }
  });

  it('reports failed rather than throwing for an options member that throws on read', () => {
    installNotification({ permission: 'granted' });

    const hostileOptions = {
      get body(): string {
        throw new Error('hostile getter');
      },
    } as NotifyOptions;

    expect(() => notify('T', hostileOptions)).not.toThrow();
    expect(notify('T', hostileOptions).status).toBe('failed');
  });

  it('keeps a shown notification shown when only a convenience member throws on read', () => {
    installNotification({ permission: 'granted' });

    const hostileOptions = {
      body: 'B',
      get autoCloseMs(): number {
        throw new Error('hostile getter');
      },
    } as NotifyOptions;

    expect(() => notify('T', hostileOptions)).not.toThrow();
    expect(notify('T', hostileOptions).status).toBe('shown');
  });

  it('takes any permission name without throwing', async () => {
    installNavigator({ permissions: { query: () => Promise.resolve({ state: 'granted' }) } });

    const hostile: unknown[] = ['', 'not-a-permission', '__proto__'];
    for (const name of hostile) {
      await expect(queryPermission(name as string)).resolves.toBeTypeOf('string');
    }
  });

  it('answers every entry point under a fully empty environment', async () => {
    removeNotification();
    removeNavigator();
    removeWindow();

    expect(getNotificationPermission()).toBe('unsupported');
    expect(canNotify()).toBe(false);
    expect(notify('T', { body: 'B', autoCloseMs: 10, onClick: () => undefined })).toEqual({ status: 'unsupported' });
    await expect(requestNotificationPermission()).resolves.toBe('unsupported');
    await expect(queryPermission('notifications')).resolves.toBe('unsupported');
  });
});
