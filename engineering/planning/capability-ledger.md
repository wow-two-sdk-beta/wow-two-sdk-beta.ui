# Capability ledger

*Last updated: 2026-08-23*

> What the router and query layers provide today, and what is planned — `[x]` shipped · `[ ]` planned.
> Purpose — a shipped-versus-planned list is a surface register, so it belongs beside the code it tracks.
> Use case — checking whether a capability exists before building around its absence.

Moved out of the conventions tree on 2026-08-23: `conventions.md` keeps the surface register out of
conventions, because a list of an instance's API goes stale the release after it is written.

---

## Router

> What the router layer provides — app-local in `bootstrap/router/` now, combining into the front SDK
> `@wow-two-beta/ui` (`/router` subpath) later. `[x]` shipped · `[ ]` planned.

**Core**
- [x] `createAppRouter(routes, options)` · `AppRoute` / `RouteConfig` model
- [x] `AppRoot` (`<ScrollRestoration>` + `<Outlet>`) · `AppErrorBoundary` (root) · `NotFound` (`*`)
- [x] `lazy` code-split places · `redirect` · `layout` nesting · `basename` · `history:'hash'`
- [x] `DocumentTitle` (`handle.title` + `titleSuffix`) · `DocumentMeta` (`handle.meta`) · `useParams`

**Navigation & UX**
- [x] `paths` typed registry + `definePath` param-inferring builders (no raw `to=` strings)
- [x] `NavigationProgress` — mode-switch bar ↔ backend heartbeat (`ProgressProvider` / `track()`)
- [x] `usePrefetch` / `prefetchProps` — intent (hover/focus) prefetch (wired into `AppNavLink`)
- [x] `AppNavLink` — `NavLink` active + View Transitions
- [x] `useNavigationBlocker` — dirty-form + `beforeunload` prompt
- [x] `RoutePersistence` + index-restore — tab-reopen returns to last route

**Access & data**
- [x] `AppRoute.guard` seam → loader redirect (chain-aware runner)
- [x] `returnTo` — `requireAuth` capture + `useReturnTo` restore (open-redirect-safe)
- [x] `useTypedSearchParams`

**a11y & meta**
- [x] `RouteAnnouncer` — focus reset + aria-live route announce
- [x] `PageViewTracker` — analytics sink on navigation (`onPageView` option)
- [x] `RouteHandle.meta` → `DocumentMeta` — description / name meta tags
- [x] `lazyRoute` — stale-deploy chunk retry-once (+ `reloadOnChunkError`)

**SDK dependency**
- [x] `NavItem asChild` (Slottable) — adopted in `AppNavLink`

---

---

## Query

> What the data layer provides — app-local in `bootstrap/query/` now, combining into the front SDK
> `@wow-two-beta/ui/query`. `[x]` shipped · `[ ]` planned.

**Core**
- [x] `createQueryClient({ retry?: RetryPolicy })` — house defaults (30s stale · 5m gc · no focus-refetch ·
  mutations no-retry) + a configurable retry policy (backoff · jitter · retryable statuses, from
  `foundation/resilience`) + global `onError` → `AppError`
- [x] `QueryProvider` — mounts the client above `<RouterProvider>` · `toAppError` (coerce any throw from a
  third party → `AppError`) · `queryKeys` (typed key registry — the data-layer `paths`)

**Hooks — every read/write shape**
- [x] `useAppQuery` (single) · `useAppInfiniteQuery` (cursor + **poll-while-running**) ·
  `useAppPaginatedQuery` (page/offset, keep-previous)
- [x] `useAppQueries` (dynamic N parallel) · `useAppSuspenseQuery` (suspends, pairs with lazy routes) ·
  `useAppLazyQuery` (imperative / on-demand)
- [x] `useAppMutation` — **passive** (no `onMutate`) · `invalidates` / `onConfirmed`
- [x] `usePrefetchQuery` / `prefetchProps` (intent data prefetch) · `useQueryCache` (imperative
  get/set/invalidate/remove/prefetch)

**Integrations & infra**
- [x] `QueryProgressBridge` — RQ activity → the router's `NavigationProgress` backend heartbeat
- [x] `setupQueryPersistence` (localStorage cache, opt-in) · `QueryDevtools` (dev-only) · `QueryTestUtils`
  (test-only entrypoint)
- [x] **Retry** — `foundation/resilience`: `RetryPolicy` (backoff constant/linear/exp · jitter
  none/full/equal/decorrelated · retryable statuses) + `computeRetryDelay` / `shouldRetry`; reusable beyond
  query

**Interlocks with the router:** `queryKeys`↔`paths` · heartbeat↔`NavigationProgress` ·
data-prefetch↔chunk-prefetch · suspense↔lazy routes · cache-persist↔`RoutePersistence`.
