import type { AuthResolveContext, AuthStrategy } from './AuthSession';
import { createMemoryTokenStorage, type TokenStorage } from './TokenStorage';

/** Defines the outcome of a bearer credential exchange. */
export interface BearerAuthenticateResult<TUser> {
  /** The bearer token stored and sent on subsequent requests. */
  readonly token: string;

  /** The signed-in user the session becomes. */
  readonly user: TUser;
}

/** Defines the options for {@link createBearerStrategy}. */
export interface CreateBearerStrategyOptions<TUser, TSignInInput = unknown> {
  /** Exchanges credentials for a token + user (e.g. `POST` a password) — a throw propagates to the `signIn` caller (show it on the form). */
  readonly authenticate: (input: TSignInInput, context: AuthResolveContext) => Promise<BearerAuthenticateResult<TUser>>;

  /** Where the token lives. Default `createMemoryTokenStorage()` — never persisted, a reload requires re-login (the secrets-vault posture). */
  readonly tokenStorage?: TokenStorage;

  /** Restores the user behind a persisted token (me-resolve with the token). Without it, a token found on mount is discarded — sessions restore only when the user can be rebuilt. */
  readonly resolveUser?: (context: AuthResolveContext & { readonly token: string }) => Promise<TUser | null>;

  /** An optional server-side revoke called on sign-out — the token clears locally regardless of the outcome. */
  readonly signOut?: (context: AuthResolveContext) => Promise<void> | void;
}

/** Defines the bearer strategy — an {@link AuthStrategy} plus the `getAuthToken` reader that feeds the api client. */
export interface BearerStrategy<TUser, TSignInInput = unknown> extends AuthStrategy<TUser, TSignInInput> {
  /** Feeds `createApiClient({ getAuthToken })` — re-read on every request, so headers always reflect the live session. */
  readonly getAuthToken: () => string | null;

  /** The storage behind the strategy — exposed for tests and advanced wiring. */
  readonly tokenStorage: TokenStorage;
}

/**
 * Creates the bearer-token strategy — the token lives in a {@link TokenStorage} delegate
 * (in-memory by default), `signIn` runs the credential exchange, and a bridged 401 clears the
 * token before the session flips to anonymous. Wire the api client with the returned
 * `getAuthToken`. Covers the secrets-vault shape.
 */
export function createBearerStrategy<TUser, TSignInInput = unknown>(
  options: CreateBearerStrategyOptions<TUser, TSignInInput>,
): BearerStrategy<TUser, TSignInInput> {
  const storage = options.tokenStorage ?? createMemoryTokenStorage();

  return {
    tokenStorage: storage,
    getAuthToken: () => storage.get(),

    async resolveUser(context: AuthResolveContext): Promise<TUser | null> {
      const token = storage.get();
      if (token == null) return null;
      if (!options.resolveUser) {
        // A token we cannot turn back into a user is dead weight — drop it so the api client
        // stops sending a header the session no longer stands behind.
        storage.set(null);
        return null;
      }
      // A throw keeps the token (transient failure ≠ revoked session); a `null` result clears it.
      const user = await options.resolveUser({ ...context, token });
      if (user == null) storage.set(null);
      return user;
    },

    async signIn(input: TSignInInput, context: AuthResolveContext): Promise<TUser> {
      const { token, user } = await options.authenticate(input, context);
      storage.set(token);
      return user;
    },

    async signOut(context: AuthResolveContext): Promise<void> {
      try {
        await options.signOut?.(context);
      } finally {
        storage.set(null);
      }
    },

    onUnauthorized(): void {
      storage.set(null);
    },
  };
}
