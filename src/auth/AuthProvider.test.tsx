import { StrictMode, type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { ApiError } from '../foundation/http';

import { createAuthBridge, type AuthBridge } from './AuthBridge';
import { AuthProvider, useAuth, type AuthProviderProps } from './AuthProvider';
import { AuthStatus, type AuthStrategy } from './AuthSession';
import { createCookieStrategy, type CookieAuthClient } from './CookieStrategy';

interface User {
  readonly id: string;
  readonly name: string;
}

const Ada: User = { id: '1', name: 'Ada' };
const Bob: User = { id: '2', name: 'Bob' };

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

/** Builds a renderHook wrapper mounting an `AuthProvider` with the given props. */
function createWrapper(props: Omit<AuthProviderProps<User, unknown>, 'children'>, strict = false) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    const tree = <AuthProvider<User, unknown> {...props}>{children}</AuthProvider>;
    return strict ? <StrictMode>{tree}</StrictMode> : tree;
  };
}

describe('AuthProvider', () => {
  it('resolves to authenticated on mount (unknown → resolving → authenticated)', async () => {
    const d = deferred<User | null>();
    const resolveUser = vi.fn(() => d.promise);
    const statuses: AuthStatus[] = [];
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({
        strategy: { resolveUser },
        onSessionChange: (session) => statuses.push(session.status),
      }),
    });

    // The mount effect starts the resolve synchronously.
    expect(result.current.status).toBe(AuthStatus.Resolving);
    expect(result.current.isPending).toBe(true);
    expect(result.current.user).toBeNull();

    await act(async () => {
      d.resolve(Ada);
      await d.promise;
    });

    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));
    expect(result.current.user).toEqual(Ada);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isPending).toBe(false);
    expect(resolveUser).toHaveBeenCalledTimes(1);
    expect(statuses).toEqual([AuthStatus.Unknown, AuthStatus.Resolving, AuthStatus.Authenticated]);
  });

  it('resolves to anonymous when the strategy returns null', async () => {
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => null } }),
    });

    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('settles anonymous on a 401 me-resolve through the cookie strategy without reporting an error', async () => {
    const client = {
      get: vi.fn(() => Promise.reject(new ApiError(401, null))),
      post: vi.fn(async () => undefined),
    } as unknown as CookieAuthClient;
    const onResolveError = vi.fn();
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: createCookieStrategy<User>({ client }), onResolveError }),
    });

    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));
    expect(onResolveError).not.toHaveBeenCalled(); // 401 = signed out, not a failure
  });

  it('settles anonymous and reports when the resolve throws', async () => {
    const error = new Error('network down');
    const onResolveError = vi.fn();
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: () => Promise.reject(error) }, onResolveError }),
    });

    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));
    expect(onResolveError).toHaveBeenCalledWith(error);
  });

  it('dedupes the mount resolve under StrictMode double-effects', async () => {
    const resolveUser = vi.fn(async () => Ada);
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser } }, true),
    });

    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));
    expect(resolveUser).toHaveBeenCalledTimes(1);
  });

  it('stays unknown with resolveOnMount: false until refresh() runs', async () => {
    const resolveUser = vi.fn(async () => Ada);
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser }, resolveOnMount: false }),
    });

    expect(result.current.status).toBe(AuthStatus.Unknown);
    expect(result.current.isPending).toBe(true);
    expect(resolveUser).not.toHaveBeenCalled();

    let refreshed: User | null = null;
    await act(async () => {
      refreshed = await result.current.refresh();
    });

    expect(refreshed).toEqual(Ada);
    expect(result.current.status).toBe(AuthStatus.Authenticated);
  });

  it('signIn applies the user returned by the strategy', async () => {
    const signIn = vi.fn(async () => Bob);
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => null, signIn } }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));

    let signedIn: User | null = null;
    await act(async () => {
      signedIn = await result.current.signIn({ password: 'hunter2' });
    });

    expect(signedIn).toEqual(Bob);
    expect(result.current.status).toBe(AuthStatus.Authenticated);
    expect(result.current.user).toEqual(Bob);
    expect(signIn).toHaveBeenCalledWith({ password: 'hunter2' }, {});
  });

  it('signIn returning void leaves the session unchanged (redirect flows navigate away)', async () => {
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => null, signIn: () => undefined } }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));

    let outcome: User | null = Ada;
    await act(async () => {
      outcome = await result.current.signIn();
    });

    expect(outcome).toBeNull();
    expect(result.current.status).toBe(AuthStatus.Anonymous);
  });

  it('signIn rejects when the strategy does not implement it', async () => {
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => null } }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));

    await expect(result.current.signIn()).rejects.toThrow(/does not implement signIn/);
  });

  it('signIn errors propagate to the caller and the session stays put', async () => {
    const failure = new ApiError(400, null, 'bad password');
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({
        strategy: {
          resolveUser: async () => null,
          signIn: () => Promise.reject(failure),
        },
      }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));

    await act(async () => {
      await expect(result.current.signIn('nope')).rejects.toBe(failure);
    });
    expect(result.current.status).toBe(AuthStatus.Anonymous);
  });

  it('signOut runs the strategy and clears the session', async () => {
    const signOut = vi.fn(async () => undefined);
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => Ada, signOut } }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOut).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(AuthStatus.Anonymous);
    expect(result.current.user).toBeNull();
  });

  it('signOut clears the session even when the server call rejects', async () => {
    const failure = new ApiError(500, null, 'sign-out failed');
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({
        strategy: { resolveUser: async () => Ada, signOut: () => Promise.reject(failure) },
      }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));

    await act(async () => {
      await expect(result.current.signOut()).rejects.toBe(failure);
    });
    expect(result.current.status).toBe(AuthStatus.Anonymous);
    expect(result.current.user).toBeNull();
  });

  it('setUser applies an externally obtained user and null flips back to anonymous', async () => {
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => null } }),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Anonymous));

    // e.g. a Google ID-token exchange completed by a button hands the user straight in.
    act(() => result.current.setUser(Ada));
    expect(result.current.status).toBe(AuthStatus.Authenticated);
    expect(result.current.user).toEqual(Ada);

    act(() => result.current.setUser(null));
    expect(result.current.status).toBe(AuthStatus.Anonymous);
    expect(result.current.user).toBeNull();
  });

  it('refresh re-resolves and swaps the user', async () => {
    let calls = 0;
    const users = [Ada, Bob] as const;
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: async () => users[calls++] ?? null } }),
    });
    await waitFor(() => expect(result.current.user).toEqual(Ada));

    await act(async () => {
      await result.current.refresh();
    });

    expect(calls).toBe(2);
    expect(result.current.user).toEqual(Bob);
    expect(result.current.status).toBe(AuthStatus.Authenticated);
  });

  it('a stale resolve settling late cannot clobber a newer transition', async () => {
    const d = deferred<User | null>();
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: createWrapper({ strategy: { resolveUser: () => d.promise } }),
    });
    expect(result.current.status).toBe(AuthStatus.Resolving);

    // A newer explicit transition lands while the me-request is still in flight…
    act(() => result.current.setUser(Bob));
    expect(result.current.user).toEqual(Bob);

    // …then the stale resolve settles with a different user — and must be ignored.
    await act(async () => {
      d.resolve(Ada);
      await d.promise;
    });
    expect(result.current.user).toEqual(Bob);
    expect(result.current.status).toBe(AuthStatus.Authenticated);
  });

  describe('with a bridge', () => {
    it('a bridged 401 flips the session to anonymous and notifies strategy + callback', async () => {
      const bridge: AuthBridge<User> = createAuthBridge<User>();
      const onUnauthorizedStrategy = vi.fn();
      const onUnauthorizedProp = vi.fn();
      const strategy: AuthStrategy<User> = {
        resolveUser: async () => Ada,
        onUnauthorized: onUnauthorizedStrategy,
      };
      const { result } = renderHook(() => useAuth<User>(), {
        wrapper: createWrapper({ strategy, bridge, onUnauthorized: onUnauthorizedProp }),
      });
      await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));

      const error = new ApiError(401, null);
      act(() => bridge.onUnauthorized(error));

      expect(result.current.status).toBe(AuthStatus.Anonymous);
      expect(result.current.user).toBeNull();
      expect(onUnauthorizedStrategy).toHaveBeenCalledTimes(1);
      expect(onUnauthorizedProp).toHaveBeenCalledWith(error);
    });

    it('publishes the session so bridge.isAuthenticated awaits the settle', async () => {
      const bridge = createAuthBridge<User>();
      const d = deferred<User | null>();
      renderHook(() => useAuth<User>(), {
        wrapper: createWrapper({ strategy: { resolveUser: () => d.promise }, bridge }),
      });

      const pending = bridge.isAuthenticated(); // taken while resolving — must wait
      await act(async () => {
        d.resolve(Ada);
        await d.promise;
      });

      await expect(pending).resolves.toBe(true);
      expect(bridge.getSession()).toEqual({ status: AuthStatus.Authenticated, user: Ada });
      await expect(bridge.isAuthenticated()).resolves.toBe(true); // settled → immediate
    });
  });
});
