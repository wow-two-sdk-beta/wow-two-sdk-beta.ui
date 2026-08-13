import { ApiError, type ApiClient } from '../foundation/http';

import type { AuthResolveContext, AuthStrategy } from './AuthSession';

/** Defines the slice of the SDK `ApiClient` the cookie strategy calls — any object with `get`/`post` fits (fakes included). */
export type CookieAuthClient = Pick<ApiClient, 'get' | 'post'>;

/** Defines the context passed to a cookie strategy's custom `signIn` delegate. */
export interface CookieSignInContext extends AuthResolveContext {
  /** The strategy's HTTP client — call sign-in endpoints (guest creation, credential/ID-token exchange) through it. */
  readonly client: CookieAuthClient;
}

/** Defines the options for {@link createCookieStrategy}. */
export interface CreateCookieStrategyOptions<TUser, TSignInInput = unknown> {
  /** The HTTP client the strategy calls — the app's `createApiClient` (same-origin, or `credentials: 'include'` cross-origin). */
  readonly client: CookieAuthClient;

  /** The me-resolve endpoint (GET). Default `/api/identity/me` — the backend SDK identity baseline. */
  readonly mePath?: string;

  /** The sign-out endpoint (POST). Default `/api/identity/sign-out`; pass `null` to skip the server call and clear locally only. */
  readonly signOutPath?: string | null;

  /** Treats a 200 me-response as signed out (e.g. smart-qr's `kind === 'anonymous'` guest gate). Default: every resolved user counts as authenticated. */
  readonly isAnonymous?: (user: TUser) => boolean;

  /** A custom sign-in exchange (guest creation, password post, Google ID-token swap) — return the user to authenticate immediately. */
  readonly signIn?: (input: TSignInInput, context: CookieSignInContext) => Promise<TUser | null | void> | TUser | null | void;
}

/**
 * Creates the cookie-session strategy — the session cookie is owned by the backend; the client
 * only resolves `GET {mePath}` on mount (401 → anonymous, other failures settle anonymous and are
 * reported) and posts `{signOutPath}` on sign-out. Covers the drydock and smart-qr shapes; pair
 * with `isAnonymous`/`signIn` for guest gates, or use `createRedirectStrategy` for OAuth sign-in.
 */
export function createCookieStrategy<TUser, TSignInInput = unknown>(
  options: CreateCookieStrategyOptions<TUser, TSignInInput>,
): AuthStrategy<TUser, TSignInInput> {
  const { client, mePath = '/api/identity/me', signOutPath = '/api/identity/sign-out', isAnonymous, signIn } = options;

  const strategy: AuthStrategy<TUser, TSignInInput> = {
    async resolveUser(context: AuthResolveContext): Promise<TUser | null> {
      let user: TUser | undefined;
      try {
        user = await client.get<TUser>(mePath, context.signal ? { signal: context.signal } : undefined);
      } catch (error) {
        // 401 = simply signed out — not a failure. Anything else propagates: the provider settles
        // anonymous and reports it via `onResolveError` (the drydock/smart-qr posture).
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
      if (user == null) return null;
      return isAnonymous?.(user) ? null : user;
    },

    async signOut(context: AuthResolveContext): Promise<void> {
      if (signOutPath === null) return;
      await client.post<void>(signOutPath, context.signal ? { signal: context.signal } : undefined);
    },
  };

  if (signIn) {
    strategy.signIn = (input: TSignInInput, context: AuthResolveContext) => signIn(input, { ...context, client });
  }

  return strategy;
}
