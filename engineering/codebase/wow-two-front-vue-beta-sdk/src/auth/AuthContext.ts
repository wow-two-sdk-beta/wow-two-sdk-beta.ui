import { inject, type InjectionKey } from 'vue';

import type { AuthStatus } from './AuthSession';

/**
 * Defines the session API exposed by {@link useAuth}.
 *
 * The four state members are REACTIVE PROPERTIES — native getters over the provider's session ref,
 * not snapshots. Read them (`auth.status`, `auth.user`) in a template, a `computed`, or a `watch`
 * and they re-evaluate on every transition. Destructuring (`const { user } = useAuth()`) takes a
 * one-time copy and will not update — bind to the object instead.
 *
 * Getters rather than a `reactive()` wrapper on purpose: `reactive()` would hand back a deep proxy
 * of `user`, so `auth.user !== theUserTheAppPassedIn` and identity checks would silently fail.
 */
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

/**
 * React's `createContext<AuthApi | null>(null)` becomes an `InjectionKey`. One untyped key backs
 * every generic instantiation; `useAuth<TUser>()` re-narrows, exactly as the React original did.
 *
 * Deliberately NOT re-exported from `index.ts` — the React original kept its context module-private,
 * and the barrel shape is preserved.
 */
export const AuthKey: InjectionKey<AuthApi<unknown, unknown>> = Symbol('wow-two.auth');

/** Accesses the session API. Must be used within an {@link AuthProvider}; `TUser` re-narrows the provider's generic. */
export function useAuth<TUser = unknown, TSignInInput = unknown>(): AuthApi<TUser, TSignInInput> {
  const context = inject(AuthKey, null);
  if (context === null) throw new Error('useAuth must be used within an AuthProvider.');
  return context as AuthApi<TUser, TSignInInput>;
}
