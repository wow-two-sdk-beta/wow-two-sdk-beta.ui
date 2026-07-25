import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useNotificationPermission, usePermissionState } from '@src/foundation/notifications';

// Browser project — both hooks need a real renderer, so the pure-logic cases stay in `notifications.test.ts`
// and this file only covers what a renderer adds: the mount-time sync, the `requesting` flag's two edges, the
// re-render on an external permission change, and listener teardown on unmount.
//
// Headless chromium has BOTH APIs natively — a real `Notification` (permission `default`) and a real
// `navigator.permissions` — so every test installs its own and `afterEach` restores the originals. The
// permissions stub is installed even where the test does not care about it: leaving the real one in place makes
// an async platform answer land mid-test and turns these assertions flaky.

const originalNotification = Object.getOwnPropertyDescriptor(globalThis, 'Notification');

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

/** A stand-in `PermissionStatus`: a real `EventTarget` that also counts listener attach / detach. */
class FakePermissionStatus extends EventTarget {
  /** How many listeners have been attached — the signal that the async subscription finished wiring. */
  added = 0;

  /** How many have been detached — what proves the unmount cleaned up. */
  removed = 0;

  constructor(public state: string) {
    super();
  }

  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void {
    this.added += 1;
    super.addEventListener(type, callback, options);
  }

  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void {
    this.removed += 1;
    super.removeEventListener(type, callback, options);
  }

  /** Moves to `next` and fires the platform's `change` event. */
  emitChange(next: string): void {
    this.state = next;
    this.dispatchEvent(new Event('change'));
  }
}

/** Installs a fake `Notification` global. Omitting `permission` removes the API entirely (the SSR shape). */
function installNotification(config: {
  permission?: string;
  requestPermission?: () => Promise<unknown>;
}): void {
  if (config.permission === undefined) {
    delete (globalThis as { Notification?: unknown }).Notification;
    return;
  }

  class StubNotification extends EventTarget {
    static permission = config.permission;
    close(): void {}
  }

  if (config.requestPermission !== undefined) {
    Object.defineProperty(StubNotification, 'requestPermission', {
      value: config.requestPermission,
      configurable: true,
    });
  }

  Object.defineProperty(globalThis, 'Notification', { value: StubNotification, configurable: true, writable: true });
}

/** Overwrites the static `permission` on the installed stub — how an external grant / revoke is simulated. */
function setInstalledPermission(permission: string): void {
  Object.defineProperty(globalThis.Notification, 'permission', { value: permission, configurable: true });
}

/** Shadows `navigator.permissions` with a stub whose `query` resolves to `status` (or fails when `null`). */
function installPermissions(status: FakePermissionStatus | null): void {
  Object.defineProperty(navigator, 'permissions', {
    value: {
      query: () => (status === null ? Promise.reject(new TypeError('unknown name')) : Promise.resolve(status)),
    },
    configurable: true,
  });
}

afterEach(() => {
  delete (navigator as { permissions?: unknown }).permissions;
  delete (globalThis as { Notification?: unknown }).Notification;
  if (originalNotification !== undefined) Object.defineProperty(globalThis, 'Notification', originalNotification);
});

describe('useNotificationPermission', () => {
  it('syncs to the standing grant on mount', async () => {
    installNotification({ permission: 'granted' });
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe('granted');
    });
    expect(result.current.granted).toBe(true);
    expect(result.current.supported).toBe(true);
    expect(result.current.requestable).toBe(false);
    expect(result.current.requesting).toBe(false);
  });

  it('reports an undecided grant as requestable', async () => {
    installNotification({ permission: 'default' });
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe('default');
    });
    expect(result.current.granted).toBe(false);
    expect(result.current.requestable).toBe(true);
  });

  it('reports a refused grant as supported but neither granted nor requestable', async () => {
    installNotification({ permission: 'denied' });
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.permission).toBe('denied');
    });
    expect(result.current.supported).toBe(true);
    expect(result.current.granted).toBe(false);
    expect(result.current.requestable).toBe(false);
  });

  it('stays unsupported when the API is absent', async () => {
    installNotification({});
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(result.current.supported).toBe(false);
    });
    expect(result.current.permission).toBe('unsupported');
    expect(result.current.granted).toBe(false);
    expect(result.current.requestable).toBe(false);
  });

  it('flips requesting while the prompt is open, then lands the outcome', async () => {
    const gate = deferred<unknown>();
    installNotification({ permission: 'default', requestPermission: () => gate.promise });
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());
    await waitFor(() => {
      expect(result.current.permission).toBe('default');
    });

    let pending!: Promise<string>;
    act(() => {
      pending = result.current.request();
    });
    expect(result.current.requesting).toBe(true);

    await act(async () => {
      gate.resolve('granted');
      await pending;
    });

    expect(result.current.requesting).toBe(false);
    expect(result.current.permission).toBe('granted');
    expect(result.current.granted).toBe(true);
    await expect(pending).resolves.toBe('granted');
  });

  it('resolves rather than rejecting when the prompt fails, keeping the standing grant', async () => {
    installNotification({ permission: 'denied', requestPermission: () => Promise.reject(new Error('insecure')) });
    installPermissions(null);

    const { result } = renderHook(() => useNotificationPermission());

    let outcome!: string;
    await act(async () => {
      outcome = await result.current.request();
    });

    expect(outcome).toBe('denied');
    expect(result.current.requesting).toBe(false);
  });

  it('re-renders on an external grant — the Permissions API change event as a signal', async () => {
    const status = new FakePermissionStatus('prompt');
    installNotification({ permission: 'default' });
    installPermissions(status);

    const { result } = renderHook(() => useNotificationPermission());

    await waitFor(() => {
      expect(status.added).toBeGreaterThan(0);
    });
    expect(result.current.permission).toBe('default');

    // The grant moved in another tab / in site settings: the platform fires `change`, the hook re-reads the
    // authoritative static rather than mapping the Permissions API's own vocabulary.
    setInstalledPermission('granted');
    await act(async () => {
      status.emitChange('granted');
    });

    expect(result.current.permission).toBe('granted');
    expect(result.current.granted).toBe(true);
  });

  it('detaches the change listener on unmount', async () => {
    const status = new FakePermissionStatus('prompt');
    installNotification({ permission: 'default' });
    installPermissions(status);

    const { unmount } = renderHook(() => useNotificationPermission());
    await waitFor(() => {
      expect(status.added).toBeGreaterThan(0);
    });

    unmount();
    expect(status.removed).toBeGreaterThan(0);

    // And nothing listening: a later change must not reach a torn-down hook.
    expect(() => status.emitChange('granted')).not.toThrow();
  });

  it('exposes a stable request callback across renders', async () => {
    installNotification({ permission: 'default' });
    installPermissions(null);

    const { result, rerender } = renderHook(() => useNotificationPermission());
    await waitFor(() => {
      expect(result.current.permission).toBe('default');
    });

    const first = result.current.request;
    rerender();
    expect(result.current.request).toBe(first);
  });
});

describe('usePermissionState', () => {
  it('starts null, then resolves to the queried state', async () => {
    const status = new FakePermissionStatus('prompt');
    installPermissions(status);

    const { result } = renderHook(() => usePermissionState('notifications'));

    expect(result.current).toBeNull();
    await waitFor(() => {
      expect(result.current).toBe('prompt');
    });
  });

  it('re-renders when the platform fires change', async () => {
    const status = new FakePermissionStatus('prompt');
    installPermissions(status);

    const { result } = renderHook(() => usePermissionState('notifications'));
    await waitFor(() => {
      expect(result.current).toBe('prompt');
    });

    await act(async () => {
      status.emitChange('granted');
    });
    expect(result.current).toBe('granted');

    await act(async () => {
      status.emitChange('denied');
    });
    expect(result.current).toBe('denied');
  });

  it('resolves unsupported when the platform refuses the name', async () => {
    installPermissions(null);

    const { result } = renderHook(() => usePermissionState('clipboard-read'));

    await waitFor(() => {
      expect(result.current).toBe('unsupported');
    });
  });

  it('detaches the change listener on unmount', async () => {
    const status = new FakePermissionStatus('prompt');
    installPermissions(status);

    const { unmount } = renderHook(() => usePermissionState('notifications'));
    await waitFor(() => {
      expect(status.added).toBeGreaterThan(0);
    });

    unmount();
    expect(status.removed).toBeGreaterThan(0);
  });

  it('never throws for a hostile name', async () => {
    installPermissions(null);

    const { result } = renderHook(() => usePermissionState('__proto__'));

    await waitFor(() => {
      expect(result.current).toBe('unsupported');
    });
  });
});
