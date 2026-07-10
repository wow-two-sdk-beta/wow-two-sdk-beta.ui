import { AuthStatus, type AuthSession } from './AuthSession';

/** Defines a listener notified when a bridged 401 arrives. */
export type UnauthorizedListener = (error?: unknown) => void;

/** Defines a listener notified on every published session snapshot. */
export type SessionListener<TUser = unknown> = (session: AuthSession<TUser>) => void;

/**
 * Defines the module-scope hub wiring the React session to the non-React seams. Create it once
 * next to the api client and feed both ends:
 *
 * - **401s in** — `createApiClient({ onUnauthorized: bridge.onUnauthorized })`; the mounted
 *   `AuthProvider` subscribes and flips the session to anonymous.
 * - **Guards out** — `requireAuth(bridge.isAuthenticated)` (`/router`); the check waits for the
 *   in-flight me-resolve to settle before allowing or redirecting.
 */
export interface AuthBridge<TUser = unknown> {
  /** Fires the 401 signal — pass as the api client's `onUnauthorized`; safe to call with no provider mounted (no-op). */
  onUnauthorized(error?: unknown): void;

  /** Resolves whether the session is authenticated, waiting for an unsettled session to settle — matches the router guard's `isAuthenticated` callback shape. */
  isAuthenticated(): Promise<boolean>;

  /** Reads the latest published session snapshot (`unknown` until a provider publishes). */
  getSession(): AuthSession<TUser>;

  /** Publishes a session snapshot — called by `AuthProvider` on every transition; call manually only in custom (non-provider) integrations. */
  publishSession(session: AuthSession<TUser>): void;

  /** Subscribes to bridged 401s — used by `AuthProvider`; returns an unsubscribe. */
  subscribeUnauthorized(listener: UnauthorizedListener): () => void;

  /** Subscribes to published session snapshots; returns an unsubscribe. */
  subscribeSession(listener: SessionListener<TUser>): () => void;
}

/** Checks whether a session has left the pending phases. */
function isSettled(session: AuthSession<unknown>): boolean {
  return session.status === AuthStatus.Authenticated || session.status === AuthStatus.Anonymous;
}

/** Creates an {@link AuthBridge} — one per app, module scope, shared by the api client, the router guards, and the `AuthProvider`. */
export function createAuthBridge<TUser = unknown>(): AuthBridge<TUser> {
  let session: AuthSession<TUser> = { status: AuthStatus.Unknown, user: null };
  const unauthorizedListeners = new Set<UnauthorizedListener>();
  const sessionListeners = new Set<SessionListener<TUser>>();
  let settleWaiters: Array<(authenticated: boolean) => void> = [];

  return {
    onUnauthorized(error?: unknown): void {
      for (const listener of [...unauthorizedListeners]) listener(error);
    },

    isAuthenticated(): Promise<boolean> {
      if (isSettled(session)) return Promise.resolve(session.status === AuthStatus.Authenticated);
      return new Promise((resolve) => settleWaiters.push(resolve));
    },

    getSession: () => session,

    publishSession(next: AuthSession<TUser>): void {
      session = next;
      for (const listener of [...sessionListeners]) listener(next);
      if (!isSettled(next)) return;
      const waiters = settleWaiters;
      settleWaiters = [];
      const authenticated = next.status === AuthStatus.Authenticated;
      for (const waiter of waiters) waiter(authenticated);
    },

    subscribeUnauthorized(listener: UnauthorizedListener): () => void {
      unauthorizedListeners.add(listener);
      return () => unauthorizedListeners.delete(listener);
    },

    subscribeSession(listener: SessionListener<TUser>): () => void {
      sessionListeners.add(listener);
      return () => sessionListeners.delete(listener);
    },
  };
}
