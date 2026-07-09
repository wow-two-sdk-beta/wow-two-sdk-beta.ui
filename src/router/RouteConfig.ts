import type { ComponentType, ReactNode } from 'react';

/** Defines per-route meta tags surfaced to the document head (read via `useMatches()`). */
export interface RouteMeta {
  /** The meta description for this route. */
  readonly description?: string;

  readonly [key: string]: string | undefined;
}

/** Defines the outcome of a route guard — `true` to allow activation, or a path to redirect to. */
export type GuardResult = true | { readonly redirect: string };

/** Defines the context a route guard receives — the react-router loader-args subset guards may read. */
export interface GuardContext {
  /** The pending navigation's request (URL, headers, abort signal). */
  readonly request: Request;

  /** The matched path params. */
  readonly params: Readonly<Record<string, string | undefined>>;
}

/** Defines a route guard — runs before the route activates; returns allow (`true`) or a redirect. */
export type RouteGuard = (context: GuardContext) => GuardResult | Promise<GuardResult>;

/** Defines per-route metadata surfaced to breadcrumbs / title / analytics via react-router's `useMatches()` — app keys pass through untouched. */
export interface RouteHandle {
  /** The breadcrumb label for this route. */
  readonly crumb?: ReactNode;

  /** The document title for this route. */
  readonly title?: string;

  /** The per-route meta tags (description / og) surfaced to the document head. */
  readonly meta?: RouteMeta;

  readonly [key: string]: unknown;
}

/** Defines a code-split route module — resolves to a `default` or a named `Component` export. */
export type LazyRoute = () => Promise<{ default: ComponentType } | { Component: ComponentType }>;

/** Defines the declarative route unit an app authors — a curated subset of react-router's `RouteObject`; `createAppRouter` injects scroll restoration, the root error boundary, and the `*` catch-all. */
export interface AppRoute {
  /** The path segment, relative to the parent. Omit for a pathless layout route. */
  readonly path?: string;

  /** Renders in the parent's `<Outlet>` at the parent's path. Mutually exclusive with `path`. */
  readonly index?: boolean;

  /** The eager element. Use `lazy` to code-split instead. */
  readonly element?: ReactNode;

  /** A code-split module for this route — preferred for pages. */
  readonly lazy?: LazyRoute;

  /** A `*Layout` that renders an `<Outlet>`; sugar for an element wrapping nested children. */
  readonly layout?: ComponentType;

  /** Redirect this route to another path (compiles to a redirecting loader). */
  readonly redirect?: string;

  /** A guard (or chain) run before activation — a blocking result compiles to a redirecting loader. */
  readonly guard?: RouteGuard | readonly RouteGuard[];

  /** Per-route metadata (crumb / title / meta / app keys). */
  readonly handle?: RouteHandle;

  /** A route-scoped error boundary; falls back to the wrapper's root boundary. */
  readonly errorElement?: ReactNode;

  /** Nested child routes. */
  readonly children?: readonly AppRoute[];

  /** A stable id for `useMatches()` / handle lookups. */
  readonly id?: string;
}

/** Defines the full route tree an app passes to `createAppRouter`. */
export type RouteConfig = readonly AppRoute[];
