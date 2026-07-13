// Integration seam: `bridge.isAuthenticated` matches the `() => boolean | Promise<boolean>`
// callback the router's `requireAuth` guard was built around ("pass a stub today, swap the real
// check in later") — so gating a route off the live session is one wiring line, zero router edits.
import { type ReactNode } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { requireAuth } from '@src/router/Guards';
import type { GuardContext } from '@src/router/RouteConfig';

import { createAuthBridge } from '@src/auth/AuthBridge';
import { AuthProvider, useAuth } from '@src/auth/AuthProvider';
import { AuthStatus } from '@src/auth/AuthSession';

interface User {
  readonly id: string;
}

const Ada: User = { id: '1' };

/** A promise plus its resolve handle. */
function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const guardContext = (url: string): GuardContext => ({ request: new Request(url), params: {} });

describe('router guard integration', () => {
  it('requireAuth(bridge.isAuthenticated) waits for the resolve, then redirects an anonymous session with returnTo', async () => {
    const d = deferred<User | null>();
    const bridge = createAuthBridge<User>();
    renderHook(() => useAuth<User>(), {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <AuthProvider<User> strategy={{ resolveUser: () => d.promise }} bridge={bridge}>
          {children}
        </AuthProvider>
      ),
    });

    const guard = requireAuth(bridge.isAuthenticated, '/login');
    const pending = guard(guardContext('http://localhost/library?q=1')); // navigation arrives mid-resolve

    await act(async () => {
      d.resolve(null); // me-resolve settles anonymous
      await d.promise;
    });

    await expect(pending).resolves.toEqual({ redirect: '/login?returnTo=%2Flibrary%3Fq%3D1' });
  });

  it('allows activation once the session is authenticated', async () => {
    const bridge = createAuthBridge<User>();
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <AuthProvider<User> strategy={{ resolveUser: async () => Ada }} bridge={bridge}>
          {children}
        </AuthProvider>
      ),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));

    const guard = requireAuth(bridge.isAuthenticated, '/login');
    await expect(guard(guardContext('http://localhost/library'))).resolves.toBe(true);
  });

  it('redirects again after signOut flips the session', async () => {
    const bridge = createAuthBridge<User>();
    const { result } = renderHook(() => useAuth<User>(), {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <AuthProvider<User> strategy={{ resolveUser: async () => Ada }} bridge={bridge}>
          {children}
        </AuthProvider>
      ),
    });
    await waitFor(() => expect(result.current.status).toBe(AuthStatus.Authenticated));

    await act(async () => {
      await result.current.signOut();
    });

    const guard = requireAuth(bridge.isAuthenticated, '/login');
    await expect(guard(guardContext('http://localhost/settings'))).resolves.toEqual({
      redirect: '/login?returnTo=%2Fsettings',
    });
  });
});
