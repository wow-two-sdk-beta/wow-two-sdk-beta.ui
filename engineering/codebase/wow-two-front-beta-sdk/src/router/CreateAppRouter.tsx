import { createElement, type ReactNode } from 'react';
import { createBrowserRouter, createHashRouter, redirect, type LoaderFunctionArgs, type RouteObject } from 'react-router-dom';

import { AppErrorBoundary } from './AppErrorBoundary';
import { AppRoot } from './AppRoot';
import { NotFound } from './NotFound';
import type { AppRoute, LazyRoute, RouteConfig, RouteGuard } from './RouteConfig';
import type { PageView } from './PageViewTracker';

/** Defines the history strategy the router uses. */
export const RouterHistory = {
  /** Refers to the HTML5 History API — clean URLs (default). */
  Browser: 'browser',
  /** Refers to hash-based history — static hosting / file protocol. */
  Hash: 'hash',
} as const;

export type RouterHistory = (typeof RouterHistory)[keyof typeof RouterHistory];

/** Options for `createAppRouter` — every field defaults sensibly; apps usually pass none. */
export interface CreateAppRouterOptions {
  /** A leading path prefix for every route. */
  readonly basename?: string;

  /** Overrides the built-in root error boundary. */
  readonly errorElement?: ReactNode;

  /** Overrides the built-in `*` catch-all page. */
  readonly notFound?: ReactNode;

  /** Whether to restore scroll position across navigations. Default `true`. */
  readonly scrollRestoration?: boolean;

  /** The document-title suffix (usually the app name) applied on every navigation. */
  readonly titleSuffix?: string;

  /** The history strategy — `RouterHistory.Hash` uses `createHashRouter` (static hosting / haven). Default `RouterHistory.Browser`. */
  readonly history?: RouterHistory;

  /** Emits a page-view on each navigation — an analytics sink; when set, mounts a `PageViewTracker`. */
  readonly onPageView?: (view: PageView) => void;
}

/** Normalizes a `default | Component` lazy module into react-router's `lazy` shape. */
function toLazy(lazy: LazyRoute) {
  return async () => {
    const module = await lazy();
    return { Component: 'default' in module ? module.default : module.Component };
  };
}

/** Normalizes a route's `guard` (one or a chain) into an array. */
function toGuards(guard: AppRoute['guard']): readonly RouteGuard[] {
  if (!guard) return [];
  return ([] as RouteGuard[]).concat(guard);
}

/** Compiles a route's guards + `redirect` into a single react-router loader (or `undefined` if neither). */
function toLoader(guards: readonly RouteGuard[], redirectTo: string | undefined) {
  if (!guards.length && !redirectTo) return undefined;
  return async ({ request, params }: LoaderFunctionArgs) => {
    for (const guard of guards) {
      const result = await guard({ request, params });
      if (result !== true) throw redirect(result.redirect);
    }
    if (redirectTo) throw redirect(redirectTo);
    return null;
  };
}

/** Maps one `AppRoute` (our model) to a react-router `RouteObject`. */
function toRouteObject(route: AppRoute): RouteObject {
  const { path, index, element, lazy, layout, redirect: to, guard, handle, errorElement, children, id } = route;

  const base: Record<string, unknown> = { id, handle, errorElement };
  const loader = toLoader(toGuards(guard), to);
  if (loader) base.loader = loader;
  if (lazy) base.lazy = toLazy(lazy);
  else if (layout) base.element = createElement(layout);
  else if (element !== undefined) base.element = element;
  if (children) base.children = children.map(toRouteObject);

  const routeObject = index
    ? { ...base, index: true as const }
    : path !== undefined
      ? { ...base, path }
      : base;
  return routeObject as RouteObject;
}

/**
 * Builds the app's router from a declarative `RouteConfig`. The app declares its routes; this
 * wrapper owns the react-router machinery — injecting `<ScrollRestoration>`, a root error
 * boundary, and the `*` → NotFound catch-all so apps never hand-write them. It is the single
 * extension point: cross-cutting routing behavior is added here, every consumer inherits it.
 */
export function createAppRouter(config: RouteConfig, options: CreateAppRouterOptions = {}) {
  const children: RouteObject[] = config.map(toRouteObject);
  children.push({ path: '*', element: options.notFound ?? createElement(NotFound) });

  const root: RouteObject = {
    element: createElement(AppRoot, {
      scrollRestoration: options.scrollRestoration ?? true,
      titleSuffix: options.titleSuffix,
      onPageView: options.onPageView,
    }),
    errorElement: options.errorElement ?? createElement(AppErrorBoundary),
    children,
  };

  const create = options.history === RouterHistory.Hash ? createHashRouter : createBrowserRouter;
  return create([root], { basename: options.basename });
}
