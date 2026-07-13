# `/router` — maturity review (pre-migration)

*Last updated: 2026-07-11*

> Review of the `/router` subpath (`src/router/**`, ~1,040 source LOC / 16 test files · ~1,630 test LOC after this pass) before apps migrate onto it.
> Scope: correctness/edge cases · React 19 + StrictMode · coverage map · API/DX · performance · [swappable-modules](../../../../../../conventions/development/swappable-modules.md) scoring.
> Verified against installed `react-router-dom@7.18.1` internals (`createClientSideRequest`, browser/hash `createURL`) and the built `dist/` chunk graph — not just source reading.
> Companion seams read: `src/auth/AuthBridge.ts` (feeds `requireAuth`), `src/query/QueryProgressBridge.tsx` (consumes the progress heartbeat), `tsup.config.ts`, `eslint.config.js`, `conventions/…/frontend/architecture/routing.md`.

---

## 1. Verdict

**Migration-ready: YES — 0 blockers**, with two caveats to know before wiring:

1. **Don't use `basename`** until F-major-2 lands — `requireAuth`'s `returnTo` double-prefixes the basename (captured *with* basename, re-prepended by `navigate`).
2. **Don't mount `QueryProgressBridge` + rely on the built-in bar as-is** without accepting that the AppRoot bar (hard-coded `mode="both"`) flashes on *every* React Query fetch, including background refetches, alongside the heartbeat.

Everything else is solid: the guard/loader compilation is correct (chain order, short-circuit, redirect precedence — now pinned by tests), `returnTo` is genuinely open-redirect-safe (protocol-relative, backslash, and control-char bypasses all rejected), chunk-retry can't storm or reload-loop, prefetch dedupes, the progress ref-count is idempotent/clamped, and StrictMode double-effects are absorbed everywhere (two gaps fixed in this pass). Gates: unit+browser across `src/{router,auth,query}` green ×2 (246 tests), `pnpm typecheck`, `pnpm lint`.

Four in-lane defects were found and fixed inline (§4) — the worst was the route announcer stealing focus on every `setSearchParams` update, which would have hit any dashboard-filter screen on day one of migration.

---

## 2. Findings

| # | Sev | Where | Issue | Fix / defer |
|---|---|---|---|---|
| F-major-1 | major | **FIXED 2026-07-11** (deep import in `src/query`; dist re-verified) — was:  `src/query/QueryProgressBridge.tsx:4` → `dist/chunk-DUWGSION.js` | **Peer isolation broken for `/query`**: it imports the `../router` *barrel*, so tsup merges the whole router graph (incl. the top-level `import … from 'react-router-dom'`) into the chunk `/query` loads. An app using `/query` without rrd installed (rrd is an *optional* peer) fails to resolve. Violates the invariant written in `tsup.config.ts` ("keeps its react-router-dom peer dep out of every other entry"). Verified in `dist`. | 1-line fix, **out of lane** (`src/query`): import `'../router/UseNavigationProgress'` deep instead of the barrel → esbuild splits a tiny rrd-free shared chunk. Rebuild + re-verify `dist`. |
| F-major-2 | major | `src/router/Guards.ts:25,30-32` + `CreateAppRouter.tsx:59-69` | **`returnTo` double-basename**: loader `request.url` *includes* the basename (rrd `createClientSideRequest` → `history.createURL(location)`, both histories), `buildReturnTo` keeps the path verbatim, and post-login `navigate(returnTo)` prepends the basename again → `/app/app/library` → NotFound. Invisible for root-served apps (all current products); breaks any basename'd deploy. Hash history is fine (request URL is built from the in-hash app path — checked in rrd source). | Defer (design): `toLoader` should hand guards a basename-stripped URL (`CreateAppRouter` knows `options.basename`; add `GuardContext.url` or re-request). Until then: document "no basename with `requireAuth`". |
| F-major-3 | major | `src/router/AppRoot.tsx:32` + `NavigationProgress` | **Progress indicator not configurable + double-indicator trap**: AppRoot hard-codes `<NavigationProgress mode="both" />`. The documented `QueryProgressBridge` recipe (heartbeat, `mode="manual"`) makes every RQ fetch light *both* the built-in top bar and the heartbeat — background refetches flash the bar app-wide. No `CreateAppRouterOptions` knob to disable/re-variant it (same gap for `RoutePersistence`, see F-minor-4). | Defer (API addition): `options.progress?: false \| { variant, mode, 'aria-label' }`. Workaround for migration: skip `QueryProgressBridge`, or accept both indicators. |
| F-fix-1 | major → **fixed** | `src/router/RouteAnnouncer.tsx:26-38` | **Focus steal on search-param navigation**: announce+focus was keyed on `location.key`, which changes on *every* entry — incl. `setSearchParams` / `useTypedSearchParams.setValues`. A filter input syncing to the URL yanked focus to `<main>` (and re-announced) per update. | Fixed in-lane: keyed on `location.pathname` (Next.js-announcer semantics) + regression test. |
| F-fix-2 | minor → **fixed** | `src/router/DocumentMeta.tsx` | **Stale meta tags**: only the current route's keys were written; a key set by the previous route (e.g. `og:title`) lingered after navigation — wrong social previews per route. | Fixed in-lane: managed-names ref; keys absent from the next route's meta are cleared. New test file. |
| F-fix-3 | minor → **fixed** | `src/router/PageViewTracker.tsx:31-35` | **Duplicate page-views**: effect deps `[location, matches]` — `useMatches` identity refreshes on revalidation (`loaderData` memo dep), and StrictMode double-invokes the mount effect → double emits to the analytics sink. | Fixed in-lane: once-per-`location.key` guard + StrictMode test. |
| F-fix-4 | minor → **fixed** | `src/router/RoutePersistence.tsx:30-35` | **Unvalidated restore target**: `navigate(saved)` with a tampered localStorage value (`//evil.com`) → cross-origin `pushState` → `SecurityError` unhandled rejection. localStorage is origin-writable; the returnTo safety check wasn't applied here. | Fixed in-lane: restore re-validates via the shared `isSafeInternalPath` (extracted from `Guards.ts`) + tests. |
| F-minor-4 | minor | `src/router/AppRoot.tsx:30` | `RoutePersistence` is mounted unconditionally: every app writes `app:lastRoute` on every navigation; the key isn't namespaced (two apps under one origin clobber each other), and `restore` is unreachable through `createAppRouter` — an app must mount a *second* `RoutePersistence` (works: its restore effect runs before AppRoot's persist effect, child-first — but fragile and undocumented). | Defer: `options.persistence?: false \| { storageKey, restore }`. |
| F-minor-5 | minor | `src/router/UseTypedSearchParams.ts:30-46` | No way to **remove** a param (`undefined` in a patch = "don't touch"; nothing maps to `.delete()` — a cleared filter stays in the URL forever). `{ replace: true }` hard-coded (paginated screens lose back-button steps). `defaults` is a memo dep — the idiomatic inline literal (`useTypedSearchParams({ page: '1' })`) recreates `values` identity every render → downstream `useEffect([values])` churn. | Defer: `null` = delete semantics + `options.replace` + key `defaults` on its serialized form (or doc "hoist defaults"). |
| F-minor-6 | minor | `src/router/Paths.ts:7-12,33` | rrd **optional segments / splats unsupported** by `definePath`: `'/p/:id?'` infers a literal `id?` param key and emits `/p/value?` — the `?` starts the query string, URL broken. `*` splats pass through as literals. Param names with chars outside `[A-Za-z0-9_]` diverge type (full tail) vs runtime (stops at the char). | Defer: reject/strip `?` (type + regex) or document "plain `:param` segments only" in the registry guidance. Current tests document the supported grammar. |
| F-minor-7 | minor | `src/router/Guards.ts:31` | `buildReturnTo` assumes a query-free `loginPath` — `/login?mode=x` produces a second `?`. | Defer (tiny): use `URLSearchParams` to append; or doc the constraint. |
| F-minor-8 | minor | `src/auth/AuthBridge.ts:55-58` (seam) | `requireAuth(bridge.isAuthenticated)`: if no `AuthProvider` ever mounts/publishes, an unsettled session **never resolves** → guarded navigation hangs with the progress bar spinning forever (no timeout). Method reference is closure-based, so unbound passing is safe (verified). | Defer (auth lane): settle-timeout or dev warning when no provider publishes within N s. Migration note: mount `AuthProvider` before wiring guards. |
| F-minor-9 | minor | `src/router/UseNavigationBlocker.ts:15` | Returns rrd's `Blocker` type verbatim (vendor type in the public contract — see §6), and rrd supports **one active blocker at a time**: two dirty forms mounted simultaneously conflict (rrd dev-warns). | Defer: house `NavigationBlocker` shape when the contract consolidates; doc "one blocker per screen". |
| F-nit-1 | nit | `src/router/AppNavLink.tsx:32` | `useMatch({ path: to })` treats `to` as a *pattern*: a `to` containing search/hash or a literal `*`/`:` segment mis-matches the active state (builder-produced hrefs are safe — `encodeURIComponent` escapes `:` and `?`; `*` `'` `(` `)` are not escaped). | Doc note: `to` must be a pure pathname. |
| F-nit-2 | nit | `src/router/AppNavLink.tsx:5` → dist | Barrel import `../presentation/nav` drags the whole nav barrel (~52 KB chunk: CommandPalette, menus, ScrollSpy…) into the `/router` shared chunk — `dist` graph reachable from the `/router` entry ≈ 150 KB pre-shake. Consumers' bundlers tree-shake it out (`sideEffects` is CSS-only), so app bundles are fine; dev-time parse + chunk coarseness only. | Owner call (import-style convention): deep-import `../presentation/nav/navItem` to split the chunk. Left untouched. |
| F-nit-3 | nit | `src/router/CreateAppRouter.tsx:45-50,78-80` | `toLazy`: a module shipping `default: undefined` still wins the `'default' in module` check → `Component: undefined`. Conflicting route fields (`lazy` + `layout` + `element`) resolve silently by precedence with no dev warning. | Defer: dev-only `console.warn` on conflicting fields. |
| F-nit-4 | nit | `src/router/LazyRoute.ts:22-31` | Retries *any* importer failure once (not only chunk-load errors) — harmless (+300 ms before surfacing a real module error). `reloadOnChunkError` is never auto-invoked (no reload-loop risk) — opt-in only, as documented. | None needed. |
| F-nit-5 | nit | `src/router/index.ts` | `NotFound` / `AppErrorBoundary` aren't exported — an app overriding one (`options.notFound`) can't reuse/extend the built-ins. | Defer: export both. |

**Version pin sanity**: `react-router-dom ^7.18.1` matches installed `7.18.1`; v7 is the current major. Note rrd v7 is a thin re-export of `react-router` — fine, but because the peer is *optional* (`peerDependenciesMeta`), a migrating app gets **no install warning** if it forgets `react-router-dom`; the migration checklist must include installing it explicitly.

**React 19 / StrictMode audit**: clean after fixes. `RouteAnnouncer` (pathname ref), `RoutePersistence` (`didRestoreRef`), `PageViewTracker` (key ref — fixed), `useNavigationBlocker` (same module-level handler re-registered — dedup-safe), `QueryProgressBridge` (unmount closes the span; remount rebalances). No `useSyncExternalStore` needed — rrd owns its store subscriptions; `ProgressProvider` is plain state. No ref-cleanup leaks found.

**Performance**: hooks subscribe through rrd context (`useLocation`/`useMatches`) — re-render per router-state commit; `useMatches` is memoized on `[matches, loaderData]` so churn is bounded. `ProgressProvider` value memo flips only on `isBusy`; `begin/end/track` are stable (a `track`-only consumer still re-renders on busy flips — split state/actions contexts if it ever matters). `NavigationProgress` is an isolated leaf. `useBreadcrumbs` returns a fresh array per render (fine for render-time use; don't feed it to effect deps).

---

## 3. Coverage map

81 tests before → **112 after** (in `src/router`; +14 `CreateAppRouter`, +6 `DocumentTitle`, +4 `DocumentMeta`, +4 `RoutePersistence`, +2 `PageViewTracker`, +1 `RouteAnnouncer`).

| Export (index.ts) | Tests | Remaining gaps (why they matter) |
|---|---|---|
| `createAppRouter` / `RouterHistory` | `CreateAppRouter.test.tsx` **(new)** — root+catch-all structure, `notFound` override, basename pass-through, hash history, nested/index/id mapping, loader compilation (allow / block / chain order + short-circuit / context payload / `redirect` / guard-before-redirect), lazy normalization (both module shapes) | Render-level integration (RouterProvider mount, `scrollRestoration` flag, `onPageView` wiring through options) — needs history-mutating browser tests; medium cost, listed not written. `layout` sugar untested. |
| `AppRoute`/`RouteConfig`/guard types | via `CreateAppRouter.test.tsx` + type-level in `Paths.test.ts` pattern | Conflicting-field combos (`lazy`+`layout`) are silent precedence — see F-nit-3. |
| `DocumentTitle` | `DocumentTitle.test.tsx` **(new)** — deepest title + suffix join, suffix-only fallback, untouched fallback, ancestor title, nav re-sync | — |
| `DocumentMeta` | `DocumentMeta.test.tsx` **(new)** — set, stale-key clear, no-meta clear, tag reuse (no duplicates) | Selector-hostile names (quotes in `name`) — app-authored, low value. |
| `RouteAnnouncer` | `RouteAnnouncer.test.tsx` (+ search-only no-steal test) | Hash-only location change (covered by the same pathname guard). |
| `RoutePersistence` | `RoutePersistence.test.tsx` (+4 tampered-value cases) | Storage-throw path (`readRoute`/`writeRoute` catch) — jsdom/chromium can't easily simulate quota; logic is a bare try/catch. |
| `PageViewTracker` | `PageViewTracker.test.tsx` (+ StrictMode single-emit, search-param new-entry emit) | True revalidation dedupe (needs a loader + `router.revalidate()`); the key-guard is exercised by the StrictMode test. |
| `NavigationProgress` (+ Mode/Variant) | `NavigationProgress.test.tsx` — all 3 modes, both variants, ref-count visibility, a11y attrs | Route-busy is mocked (`useNavigation`) — a real loader-driven show/hide would also pin timing. |
| `ProgressProvider` / `useNavigationProgress` | `UseNavigationProgress.test.tsx` — throw-outside-provider, refcount, idempotent ender, clamp-at-zero, `track` resolve/reject | — (this is the `QueryProgressBridge` contract; also covered from the query side in `src/query/QueryProgressBridge.test.tsx`). Contract judged **stable**. |
| `definePath` (+ param types) | `Paths.test.ts` — build, multi-param, encoding, `.pattern`, compile-time rejections | `:id?` / `*` grammar (unsupported — F-minor-6); missing-param runtime fallback (`''`). |
| `useTypedSearchParams` | `UseTypedSearchParams.test.tsx` — defaults, merge, round-trip, partial set, foreign-param preservation, cumulative sets, encoding | Removal semantics (none exist — F-minor-5), `defaults` identity churn. |
| `requireAuth` / `buildReturnTo` / `resolveReturnTo` / `useReturnTo` | `Guards.test.tsx` (open-redirect suite: `//`, absolute, `/\`, `\\`) + `src/auth/GuardIntegration.test.tsx` (pending-session settle, both outcomes) | **Basename returnTo (F-major-2 — would fail today)**; control-char rejection un-asserted; query-carrying `loginPath` (F-minor-7 — would fail today). |
| `AppNavLink` | `AppNavLink.test.tsx` — href, icon/label, active/inactive, `end` semantics, `viewTransition` forwarding | Hover → prefetch wiring *through* the component (prefetch itself unit-tested). |
| `useBreadcrumbs` | `UseBreadcrumbs.test.tsx` — order, crumb-less skip, empty trail | — |
| `usePrefetch` / `prefetch` / `prefetchProps` | `UsePrefetch.browser.test.ts` — dedupe across calls/hovers/focus | Failed-warm marked-as-done is *intended* (router retries on nav) — asserted nowhere; fine. |
| `useNavigationBlocker` | `UseNavigationBlocker.browser.test.ts` — useBlocker wiring, beforeunload add/remove/flip/unmount, handler shape | **Fully mocked rrd** — no real blocked-navigation integration (proceed/reset flow, rapid-nav race, blocker-while-shouldBlock-flips). The riskiest untested surface left; needs a data-router harness with real navigations. |
| `lazyRoute` / `reloadOnChunkError` | `LazyRoute.test.ts` — retry-once success, persistent-failure rejection, no-retry fast path, reload call | — |
| *(unexported)* `AppRoot`, `AppErrorBoundary`, `NotFound` | composition exercised indirectly | Render smokes only worth adding once they're exported (F-nit-5). |

---

## 4. Fixed inline (in-lane, mechanical)

1. `RouteAnnouncer.tsx` — announce/focus keyed on `location.pathname` instead of `location.key`; search/hash-only updates no longer steal focus or re-announce. +1 regression test (filter keeps focus across `?q=` nav; real page change still announces).
2. `DocumentMeta.tsx` — tracks managed tag names; keys the next route omits are cleared (no stale `og:*` across pages). + new `DocumentMeta.test.tsx` (4 tests).
3. `PageViewTracker.tsx` — emits once per history entry (`location.key` guard); revalidation `matches`-identity refreshes and StrictMode double-effects can't double-report. +2 tests (StrictMode single emit; search-param nav still counts).
4. `Guards.ts` — `isSafeReturnTo` → exported `@internal isSafeInternalPath` (not in the barrel), shared with restore.
5. `RoutePersistence.tsx` — restore re-validates the saved value as a same-origin root-relative path before `navigate` (tampered localStorage can't trigger a cross-origin `pushState` SecurityError). +4 tests.
6. New `CreateAppRouter.test.tsx` (14 tests) + `DocumentTitle.test.tsx` (6 tests) — the factory and title syncer previously had zero direct coverage.

Gates: `pnpm vitest run --project unit --project browser src/router src/auth src/query` → 246 passed, run twice · `pnpm typecheck` clean · `pnpm lint` clean.

---

## 5. S-1 swappability verdict (vs `conventions/development/swappable-modules.md`)

**Verdict: NOT a swappable module today — it's a curated wrapper, vendor-coupled by design.** The routing convention itself instructs apps to import `Link` / `Outlet` / `useParams` / `useNavigate` — and necessarily `RouterProvider` — straight from `react-router-dom`, so the vendor is the app-facing API, not an adapter behind a contract.

| Convention rule | `/router` today |
|---|---|
| House contract first; adapters never leak vendor types | **Partial** — `AppRoute`/`RouteConfig`/`GuardResult`/`PathBuilder`/`Breadcrumb`/`TypedSearchParams` are house types, but `createAppRouter` returns the vendor router (consumed by vendor `RouterProvider`), `useNavigationBlocker` returns vendor `Blocker`, and nav primitives are imported from rrd app-side. |
| Contract at the 90% real-usage surface | **Yes** — the capability matrix in `routing.md` is product-derived. |
| Native engine exposed as typed escape hatch | **Inverted** — the engine is the front door; no seal to hatch out of. |
| No engine variants as option flags | Yes (n/a — single engine). |
| Each engine its own subpath; vendor peers isolated in dist | **Met (fixed 2026-07-11)**: F-major-1 resolved via deep import; dist grep shows rrd only in `dist/router/index.js`. |
| Two adapters + one conformance suite | **No** — single engine, no house micro-router, no `describeRouterEngineConformance`. |
| App pins engine in one app-local re-export | **No** — rrd imports spread through app code per the current convention. |

**Retrofit cost (feeds the S-1 sweep):**

- **Contract consolidation — medium (~1 iteration), worth doing:** re-export the app-facing primitives from `/router` (`Link`, `NavLink`, `Outlet`, `useParams`, `useNavigate`, `useLocation`, + an `AppRouterProvider`), replace the public `Blocker` with a house `NavigationBlocker` shape, fix F-major-1's deep import, and update `routing.md` so app code imports only `@wow-two-beta/ui/router`. After that, apps have a single pin and the vendor stops appearing in app code — the convention's *App usage* rules are then satisfiable.
- **Adapter duality — large, defer:** a second engine (TanStack Router or a house micro-router) is not realistic near-term — the guard→loader compilation, `useBlocker`, `ScrollRestoration`, and `useMatches`-driven handles are deeply rrd-flavored. The declarative `AppRoute` model itself is already vendor-neutral (good base), and this review's new `CreateAppRouter.test.tsx` + behavior tests form the seed of a future conformance suite. Recommend S-1 marks `/router`: **contract-consolidation scheduled; engine-swap deferred until a second engine is plausible.**
