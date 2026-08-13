// @internal Shared readers over a matched route's `handle` — compiled into vue-router's native
// `meta`, so every one of these is a plain read off `route.matched[i].meta`. React reached the same
// data through `useMatches()`; there is no Vue counterpart, and none is needed.

import type { RouteParamsGeneric } from 'vue-router';

import type { RouteHandle } from './RouteConfig';

/**
 * The only part of a route location these readers need. Structural on purpose: `afterEach` hands
 * out a `RouteLocationNormalized` while `useRoute()` hands out a `RouteLocationNormalizedLoaded`,
 * and both satisfy this.
 */
export interface MatchedRoute {
  readonly matched: readonly { readonly meta: unknown }[];
}

/** A matched record's `meta`, read back as the `RouteHandle` it was authored as. */
export function toHandle(meta: unknown): RouteHandle | undefined {
  return (meta ?? undefined) as RouteHandle | undefined;
}

/** Reads the deepest matched route's handle value — the innermost match wins, exactly as React's reversed `useMatches()` scan did. */
export function deepestHandleValue<TValue>(
  route: MatchedRoute,
  read: (handle: RouteHandle) => TValue | undefined,
): TValue | undefined {
  for (let index = route.matched.length - 1; index >= 0; index -= 1) {
    const handle = toHandle(route.matched[index]?.meta);
    const value = handle ? read(handle) : undefined;
    if (value !== undefined) return value;
  }
  return undefined;
}

/*
 * `:name`, with an optional custom regexp group and an optional `? * +` modifier — the shapes a
 * vue-router path pattern uses. The group is non-capturing on purpose: only the param name and the
 * whole match matter.
 */
const ParamPattern = /:([A-Za-z0-9_]+)(?:\([^)]*\))?[?*+]?/g;

/**
 * Resolves a matched record's path PATTERN against the active params — `/projects/:id` → `/projects/7`.
 *
 * vue-router absolutizes a child record's `path` when the tree is built, so a matched record already
 * carries its full pattern; only the params still need substituting. React got the resolved pathname
 * for free on each `useMatches()` entry.
 */
export function resolveMatchedPath(pattern: string, params: RouteParamsGeneric): string {
  return pattern.replace(ParamPattern, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return Array.isArray(value) ? value.map(encodeURIComponent).join('/') : encodeURIComponent(value);
  });
}
