// @wow-two-beta/ui/router — declarative routing wrapper over react-router-dom v7. Apps author routes
// as a `RouteConfig` and pass them to `createAppRouter`; this module owns the react-router machinery
// (scroll restoration, root error boundary, `*` catch-all) plus a suite of root-mounted behaviors and
// nav helpers. Apps declare their own typed `paths` registry over the exported `definePath`.

// Core wrapper + declarative model
export { createAppRouter, RouterHistory, type CreateAppRouterOptions } from './CreateAppRouter';
export type {
  AppRoute,
  RouteConfig,
  RouteHandle,
  RouteMeta,
  RouteGuard,
  GuardContext,
  GuardResult,
  LazyRoute,
} from './RouteConfig';

// Root-mounted behaviors (composed by AppRoot)
export { DocumentTitle } from './DocumentTitle';
export { DocumentMeta } from './DocumentMeta';
export { RouteAnnouncer } from './RouteAnnouncer';
export { RoutePersistence } from './RoutePersistence';
export { PageViewTracker, type PageView } from './PageViewTracker';
export { NavigationProgress, NavigationProgressMode, NavigationProgressVariant } from './NavigationProgress';
export { ProgressProvider, useNavigationProgress, type NavigationProgressState } from './UseNavigationProgress';

// Typed paths + search params (generic builder only — apps declare their own `paths` registry over it)
export { definePath } from './Paths';
export type { PathBuilder, PathBuilderArgs, PathParamName, PathParams } from './Paths';
export { useTypedSearchParams, type TypedSearchParams } from './UseTypedSearchParams';

// Guards + returnTo
export { requireAuth, buildReturnTo, resolveReturnTo, useReturnTo } from './Guards';

// Nav helpers
export { AppNavLink } from './AppNavLink';
export { useBreadcrumbs, type Breadcrumb } from './UseBreadcrumbs';
export { usePrefetch, prefetch, prefetchProps, type PrefetchProps } from './UsePrefetch';
export { useNavigationBlocker } from './UseNavigationBlocker';
export { lazyRoute, reloadOnChunkError } from './LazyRoute';
