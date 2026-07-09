// returnTo round-trip — capture the page a user wanted before being bounced to login,
// then restore them there after auth.
import { useSearchParams } from 'react-router-dom';

import type { GuardContext, GuardResult, RouteGuard } from './RouteConfig';

/**
 * Builds a route guard that allows activation when authenticated, else redirects to `loginPath`
 * with the attempted path+search captured as a `returnTo` query param for post-login restore.
 *
 * Takes an `isAuthenticated` callback because the app has no auth system yet — pass a stub today,
 * swap the real check in later without touching any route.
 *
 * @example
 * // Stub until real auth lands:
 * const isAuthenticated = () => Boolean(localStorage.getItem('token'));
 * // Wire onto a protected route: { path: '/library', guard: requireAuth(isAuthenticated), lazy: … }
 */
export function requireAuth(
  isAuthenticated: () => boolean | Promise<boolean>,
  loginPath = '/login',
): RouteGuard {
  return async (context: GuardContext): Promise<GuardResult> => {
    if (await isAuthenticated()) return true;
    return { redirect: buildReturnTo(loginPath, context.request.url) };
  };
}

/** Builds a login redirect (`{loginPath}?returnTo=…`) encoding the attempted path+search from a full URL. */
export function buildReturnTo(loginPath: string, fromUrl: string): string {
  return `${loginPath}?returnTo=${encodeURIComponent(toPathAndSearch(fromUrl))}`;
}

/** Resolves the safe same-origin return path from a `returnTo` param, rejecting open-redirect targets → `fallback`. */
export function resolveReturnTo(search: URLSearchParams | string, fallback = '/'): string {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  const target = params.get('returnTo');
  if (target === null) return fallback;
  return isSafeReturnTo(target) ? target : fallback;
}

/** Provides access to the safe post-login return path read from the current URL's `returnTo` param. */
export function useReturnTo(fallback = '/'): string {
  const [searchParams] = useSearchParams();
  return resolveReturnTo(searchParams, fallback);
}

/** @internal Reduces a full (or root-relative) URL to its `pathname + search`, dropping any origin. */
function toPathAndSearch(fromUrl: string): string {
  const url = new URL(fromUrl, 'http://localhost');
  return url.pathname + url.search;
}

/** @internal Reports whether a decoded `returnTo` is a same-origin relative path (open-redirect guard). */
function isSafeReturnTo(target: string): boolean {
  if (!target.startsWith('/')) return false; // must be root-relative (rejects http:, https:, bare paths)
  if (target.startsWith('//')) return false; // protocol-relative → external host
  if (target.includes('\\')) return false; // '\' → browsers may normalize to '/' (e.g. '/\evil' → '//evil')
  // Control chars (incl. \t \n \r that browsers strip) can smuggle a bypass past the checks above.
  if ([...target].some((ch) => ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f)) return false;
  return true;
}
