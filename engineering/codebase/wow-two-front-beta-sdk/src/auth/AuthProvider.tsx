import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import type { AuthBridge } from './AuthBridge';
import { AuthStatus, type AuthSession, type AuthStrategy } from './AuthSession';

const AnonymousSession = { status: AuthStatus.Anonymous, user: null } as const;

/** Defines the session API exposed by {@link useAuth}. */
export interface AuthApi<TUser = unknown, TSignInInput = unknown> {
  /** The current machine phase (`unknown → resolving → authenticated | anonymous`). */
  readonly status: AuthStatus;

  /** The signed-in user, or `null` outside `authenticated`. */
  readonly user: TUser | null;

  /** Whether the session is settled and signed in. */
  readonly isAuthenticated: boolean;

  /** Whether the session has not settled yet (`unknown` or `resolving`) — render a splash, not the login gate. */
  readonly isPending: boolean;

  /** Runs the strategy's sign-in. Resolves the user when the exchange returns one (state → `authenticated`); resolves `null` when it doesn't (redirect flows navigate away). Exchange errors reject. */
  signIn(input?: TSignInInput): Promise<TUser | null>;

  /** Runs the strategy's sign-out — local state flips to `anonymous` regardless; a server-side failure still rejects. */
  signOut(): Promise<void>;

  /** Re-runs the me-resolve (through `resolving`); resolves the settled user, or `null`. */
  refresh(): Promise<TUser | null>;

  /** Applies an externally obtained user — e.g. a Google ID-token exchange completed by a button. `null` flips to `anonymous`. */
  setUser(user: TUser | null): void;
}

/** Defines the props for {@link AuthProvider}. */
export interface AuthProviderProps<TUser = unknown, TSignInInput = unknown> {
  /** The transport strategy (cookie / bearer / redirect factory, or bespoke delegates). Keep the instance stable — an identity change alone does not re-resolve. */
  readonly strategy: AuthStrategy<TUser, TSignInInput>;

  /** The module-scope bridge wiring the non-React seams — api-client 401s flip this session; router guards read it. */
  readonly bridge?: AuthBridge<TUser>;

  /** Whether to run the me-resolve on mount. Default `true`; with `false` the session stays `unknown` until `refresh()` or an action settles it. */
  readonly resolveOnMount?: boolean;

  /** Fires after a bridged 401 flips the session to `anonymous` — wire redirect-to-login here. */
  readonly onUnauthorized?: (error?: unknown) => void;

  /** Fires when the me-resolve throws (network / 5xx) — the session still settles `anonymous`. */
  readonly onResolveError?: (error: unknown) => void;

  /** Fires on every session snapshot, including the initial `unknown`. */
  readonly onSessionChange?: (session: AuthSession<TUser>) => void;

  /** The subtree with access to the session. */
  readonly children: ReactNode;
}

// One untyped context instance backs every generic instantiation; `useAuth<TUser>()` re-narrows.
const AuthContext = createContext<AuthApi<unknown, unknown> | null>(null);

/**
 * Owns the app session state machine (`unknown → resolving → authenticated | anonymous`) —
 * me-resolve on mount (StrictMode-deduped, never aborted mid-flight), `signIn`/`signOut`/`refresh`/
 * `setUser` actions, and optional {@link AuthBridge} wiring so api-client 401s flip the session and
 * router guards can await it. Headless: gates, splash screens, and login UI stay app-side.
 */
export function AuthProvider<TUser = unknown, TSignInInput = unknown>({
  strategy,
  bridge,
  resolveOnMount = true,
  onUnauthorized,
  onResolveError,
  onSessionChange,
  children,
}: AuthProviderProps<TUser, TSignInInput>) {
  const [session, setSession] = useState<AuthSession<TUser>>({ status: AuthStatus.Unknown, user: null });

  // Latest-ref pattern: delegates stay fresh without re-running effects or re-creating actions.
  const strategyRef = useRef(strategy);
  strategyRef.current = strategy;
  const onUnauthorizedRef = useRef(onUnauthorized);
  onUnauthorizedRef.current = onUnauthorized;
  const onResolveErrorRef = useRef(onResolveError);
  onResolveErrorRef.current = onResolveError;
  const onSessionChangeRef = useRef(onSessionChange);
  onSessionChangeRef.current = onSessionChange;

  // Guards async completions: every explicit transition bumps the generation, so a stale resolve
  // settling later cannot overwrite it.
  const generationRef = useRef(0);
  const inflightRef = useRef<Promise<TUser | null> | null>(null);

  // Publish every snapshot outward — bridge first (guards may be awaiting), then the app callback.
  useEffect(() => {
    bridge?.publishSession(session);
    onSessionChangeRef.current?.(session);
  }, [bridge, session]);

  const runResolve = useCallback((): Promise<TUser | null> => {
    // Shared in-flight promise: StrictMode's double-effect and concurrent `refresh()` calls ride
    // one me-request instead of racing duplicates (the drydock dedupe, per-provider).
    if (inflightRef.current) return inflightRef.current;

    const generation = ++generationRef.current;
    setSession({ status: AuthStatus.Resolving, user: null });

    const promise = (async (): Promise<TUser | null> => {
      let user: TUser | null;
      try {
        user = await strategyRef.current.resolveUser({});
      } catch (error) {
        user = null;
        onResolveErrorRef.current?.(error);
      }
      if (generationRef.current === generation) {
        setSession(user == null ? AnonymousSession : { status: AuthStatus.Authenticated, user });
      }
      return user;
    })().finally(() => {
      if (inflightRef.current === promise) inflightRef.current = null;
    });

    inflightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    if (resolveOnMount) void runResolve();
  }, [resolveOnMount, runResolve]);

  // Bridged 401 → strategy cleanup (bearer drops its token) → anonymous → app callback.
  useEffect(() => {
    if (!bridge) return;
    return bridge.subscribeUnauthorized((error) => {
      strategyRef.current.onUnauthorized?.();
      generationRef.current += 1;
      inflightRef.current = null;
      setSession(AnonymousSession);
      onUnauthorizedRef.current?.(error);
    });
  }, [bridge]);

  const signIn = useCallback(async (input?: TSignInInput): Promise<TUser | null> => {
    const doSignIn = strategyRef.current.signIn;
    if (!doSignIn) throw new Error('AuthProvider: the configured strategy does not implement signIn.');
    const user = (await doSignIn(input as TSignInInput, {})) ?? null;
    if (user === null) return null; // no user handed back (redirect navigating away) → state unchanged
    generationRef.current += 1;
    inflightRef.current = null;
    setSession({ status: AuthStatus.Authenticated, user });
    return user;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    generationRef.current += 1;
    inflightRef.current = null;
    try {
      await strategyRef.current.signOut?.({});
    } finally {
      setSession(AnonymousSession); // local sign-out always lands, even when the server call fails
    }
  }, []);

  const setUser = useCallback((user: TUser | null): void => {
    generationRef.current += 1;
    inflightRef.current = null;
    setSession(user == null ? AnonymousSession : { status: AuthStatus.Authenticated, user });
  }, []);

  const value = useMemo<AuthApi<TUser, TSignInInput>>(
    () => ({
      status: session.status,
      user: session.user,
      isAuthenticated: session.status === AuthStatus.Authenticated,
      isPending: session.status === AuthStatus.Unknown || session.status === AuthStatus.Resolving,
      signIn,
      signOut,
      refresh: runResolve,
      setUser,
    }),
    [session, signIn, signOut, runResolve, setUser],
  );

  return <AuthContext.Provider value={value as AuthApi<unknown, unknown>}>{children}</AuthContext.Provider>;
}

/** Accesses the session API. Must be used within an {@link AuthProvider}; `TUser` re-narrows the provider's generic. */
export function useAuth<TUser = unknown, TSignInInput = unknown>(): AuthApi<TUser, TSignInInput> {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth must be used within an AuthProvider.');
  return context as AuthApi<TUser, TSignInInput>;
}
