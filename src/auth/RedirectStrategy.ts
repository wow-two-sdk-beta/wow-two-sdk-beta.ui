import type { AuthStrategy } from './AuthSession';
import { createCookieStrategy, type CreateCookieStrategyOptions } from './CookieStrategy';

/** Defines the options for {@link createRedirectStrategy}. */
export interface CreateRedirectStrategyOptions<TUser> extends Omit<CreateCookieStrategyOptions<TUser, never>, 'signIn'> {
  /** The sign-in challenge endpoint the browser navigates to. Default `/api/identity/sign-in` — the backend SDK identity baseline. */
  readonly signInPath?: string;

  /** The query param carrying the post-login return path. Default `returnUrl` (the drydock shape). */
  readonly returnUrlParam?: string;

  /** Builds the full challenge URL from the return path — overrides `signInPath` + `returnUrlParam` entirely. */
  readonly buildSignInUrl?: (returnUrl: string) => string;

  /** Performs the navigation. Default `window.location.assign` — injectable for tests. */
  readonly navigate?: (url: string) => void;
}

/**
 * Creates the external-redirect OAuth strategy — a cookie session whose `signIn(returnUrl?)`
 * navigates the browser to the backend's sign-in challenge (`{signInPath}?{returnUrlParam}=…`);
 * the OAuth callback is handled server-side, which sets the cookie and redirects back. `returnUrl`
 * defaults to the current `pathname + search`. Covers the drydock shape.
 */
export function createRedirectStrategy<TUser>(options: CreateRedirectStrategyOptions<TUser>): AuthStrategy<TUser, string | undefined> {
  const { signInPath = '/api/identity/sign-in', returnUrlParam = 'returnUrl', buildSignInUrl, navigate, ...cookieOptions } = options;

  const base = createCookieStrategy<TUser, never>(cookieOptions);
  const buildUrl = buildSignInUrl ?? ((returnUrl: string) => `${signInPath}?${returnUrlParam}=${encodeURIComponent(returnUrl)}`);
  const doNavigate =
    navigate ??
    ((url: string) => {
      window.location.assign(url);
    });

  return {
    // Closure-based delegates off the cookie strategy — no `this`, safe to re-home.
    resolveUser: base.resolveUser,
    signOut: base.signOut,

    // Returns void on purpose: the session state stays as-is while the browser navigates away.
    signIn(returnUrl?: string): void {
      doNavigate(buildUrl(returnUrl ?? window.location.pathname + window.location.search));
    },
  };
}
