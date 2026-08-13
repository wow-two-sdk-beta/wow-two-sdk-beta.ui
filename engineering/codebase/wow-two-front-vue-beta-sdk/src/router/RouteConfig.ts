import type { Component, VNode } from 'vue';
import type { RouteLocationNormalized, RouteLocationRaw, RouteParamsGeneric } from 'vue-router';

/** Defines a breadcrumb label — the Vue counterpart of React's `ReactNode` crumb (mirrors `feedback`'s `NoticeNode`). */
export type CrumbNode = string | VNode;

/** Defines per-route meta tags surfaced to the document head (read off the deepest match's `meta.meta`). */
export interface RouteMeta {
  /** The meta description for this route. */
  readonly description?: string;

  readonly [key: string]: string | undefined;
}

/** Defines the outcome of a route guard — `true` to allow activation, or a location to redirect to. */
export type GuardResult = true | { readonly redirect: RouteLocationRaw };

/**
 * Defines the context a route guard receives.
 *
 * React's guards ran inside a react-router loader and read a `Request`; vue-router guards run as
 * `beforeEnter` and receive the two normalized locations instead. `params` is `to.params`, kept
 * under React's name because guards read it constantly.
 */
export interface GuardContext {
  /** The location being navigated to. */
  readonly to: RouteLocationNormalized;

  /** The location being navigated from. */
  readonly from: RouteLocationNormalized;

  /** The matched path params — the same object as `to.params`. */
  readonly params: RouteParamsGeneric;
}

/** Defines a route guard — runs before the route activates; returns allow (`true`) or a redirect. */
export type RouteGuard = (context: GuardContext) => GuardResult | Promise<GuardResult>;

/**
 * Defines per-route metadata surfaced to breadcrumbs / title / analytics — app keys pass through
 * untouched. Compiles into the route record's native vue-router `meta`, so `route.meta.title`
 * reads it without any helper.
 */
export interface RouteHandle {
  /** The breadcrumb label for this route. */
  readonly crumb?: CrumbNode;

  /** The document title for this route. */
  readonly title?: string;

  /** The per-route meta tags (description / og) surfaced to the document head. */
  readonly meta?: RouteMeta;

  readonly [key: string]: unknown;
}

/** Defines a code-split route module — resolves to a `default` or a named `Component` export. */
export type LazyRoute = () => Promise<{ default: Component } | { Component: Component }>;

/**
 * Defines the declarative route unit an app authors — a curated subset of vue-router's
 * `RouteRecordRaw`. `createAppRouter` compiles it: guards become `beforeEnter`, `handle` becomes
 * `meta`, `id` becomes `name`, and the `*` catch-all is appended for you.
 */
export interface AppRoute {
  /** The path segment, relative to the parent. Omit for a pathless layout route. */
  readonly path?: string;

  /** Renders in the parent's `<RouterView>` at the parent's path — compiles to a child with `path: ''`. Mutually exclusive with `path`. */
  readonly index?: boolean;

  /** The eager component. Use `lazy` to code-split instead. React's `element` (a `ReactNode`) has no Vue counterpart — a component is the unit here. */
  readonly component?: Component;

  /** A `*Layout` rendering a `<RouterView>`; an alias of `component`, kept for the React authoring shape. */
  readonly layout?: Component;

  /** A code-split module for this route — preferred for pages. */
  readonly lazy?: LazyRoute;

  /** Redirect this route to another location. Combined with `guard`, the guards run first (React's ordering). */
  readonly redirect?: RouteLocationRaw;

  /** A guard (or chain) run before activation — compiles to the record's `beforeEnter`. */
  readonly guard?: RouteGuard | readonly RouteGuard[];

  /** Per-route metadata (crumb / title / meta / app keys) — compiles to the record's `meta`. */
  readonly handle?: RouteHandle;

  /** A route-scoped error component; `AppErrorBoundary` renders it instead of its own fallback when this route is matched. */
  readonly errorComponent?: Component;

  /** Nested child routes. */
  readonly children?: readonly AppRoute[];

  /** A stable id — compiles to the record's `name`, vue-router's stable identity. */
  readonly id?: string;
}

/** Defines the full route tree an app passes to `createAppRouter`. */
export type RouteConfig = readonly AppRoute[];
