/** Defines the lifecycle phase of the app session state machine. */
export const AuthStatus = {
  /** Refers to a session not yet examined — the provider mounted with `resolveOnMount: false` and no action has run yet. */
  Unknown: 'unknown',
  /** Refers to an in-flight me-resolve — render a splash/spinner, not the login gate. */
  Resolving: 'resolving',
  /** Refers to a settled, signed-in session carrying a user. */
  Authenticated: 'authenticated',
  /** Refers to a settled, signed-out session. */
  Anonymous: 'anonymous',
} as const;

export type AuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

/** Defines a snapshot of the session — `user` is non-null exactly when `status` is `authenticated`. */
export interface AuthSession<TUser = unknown> {
  /** The current machine phase (`unknown → resolving → authenticated | anonymous`). */
  readonly status: AuthStatus;

  /** The signed-in user, or `null` outside `authenticated`. */
  readonly user: TUser | null;
}

/** Defines the call context passed to strategy delegates — forward `signal` to the transport when present. */
export interface AuthResolveContext {
  /** An optional cancellation signal for the underlying request. */
  readonly signal?: AbortSignal;
}

/**
 * Defines the pluggable transport half of the session — how the current user is resolved,
 * established, and torn down. Ship shapes: `createCookieStrategy` (me-resolve over a cookie
 * session), `createBearerStrategy` (token storage + `getAuthToken` wiring), and
 * `createRedirectStrategy` (sign-in = full-page OAuth redirect). Any object matching this
 * contract works — write delegates directly for bespoke flows.
 */
export interface AuthStrategy<TUser = unknown, TSignInInput = unknown> {
  /** Resolves the current user — `null` means signed out; a throw also settles anonymous (reported via the provider's `onResolveError`). */
  resolveUser(context: AuthResolveContext): Promise<TUser | null>;

  /** Establishes a session. Return the user to authenticate immediately; return `null`/`void` to leave state unchanged (redirect flows navigate away instead). */
  signIn?(input: TSignInInput, context: AuthResolveContext): Promise<TUser | null | void> | TUser | null | void;

  /** Tears the session down (server sign-out, token revoke) — local state flips to anonymous regardless of the outcome. */
  signOut?(context: AuthResolveContext): Promise<void> | void;

  /** Reacts to a bridged 401 (e.g. clears a stored bearer token) just before the session flips to anonymous. */
  onUnauthorized?(): void;
}
