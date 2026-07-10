# `/query` maturity review — migration readiness

*Last updated: 2026-07-11*

> Pre-migration review of `src/query/**` (all 18 sources + 16 test files) against correctness, TanStack v5 idioms, coverage, migration DX (smart-qr · drydock · transcript-forge), performance, and the [swappable-modules convention](../../../../../conventions/development/swappable-modules.md). Verified against installed `@tanstack/*` **5.101.2** source (retryer, query, queryClient, queriesObserver) and the built `dist/`.

## Verdict

**Migration-ready — 0 blockers.** The layer is correct on its core flows (retry wiring, error coercion, optimistic cancel→snapshot→patch→rollback→settle, keepPreviousData, prefetch dedupe, peer isolation of RQ). One correctness bug (cancellations retried + toasted) was found and **fixed in this review**, along with a lazy-query stale-write race. Five majors were open at review time; **M1/M3/M4/M5 fixed post-review (2026-07-11)** — deep-import isolation, `meta.suppressGlobalError` opt-out + `onError` context, `<TRaw, TData = TRaw>` inference, `page` raw access. Remaining open: M2 (if listed) and the S-1 hygiene items.

Migration prerequisites (per app):

- Install all 4 peers: `@tanstack/react-query` + `react-query-persist-client` + `query-sync-storage-persister` + `react-query-devtools` — the devtools dynamic import must *resolve* at build time even though it never loads in prod (m5).
- ~~drydock rrd-install requirement~~ **obsolete — M1 fixed** (deep import; dist verified rrd-free for `/query`). Still true: don't mount `QueryProgressBridge` without the SDK `ProgressProvider`.
- transcript-forge: near-drop-in (its vendored layer mirrors this file-for-file); SDK now additionally guards cancellations. M3 fixed — per-query `meta.suppressGlobalError` covers its job-status polling; wire `onError` freely.
- Hoist / `useCallback` every `map`/`mapPage` passed to hooks (m2) — inline lambdas re-run `select` and break child memoization every render.

## Findings

Severity: **blocker** (data loss / no workaround) · **major** (wrong behavior or real adoption friction; workaround exists) · **minor** (edge/perf/type gap) · **nit** (cosmetic).

| # | Sev | Where | Issue | Fix / defer |
|---|---|---|---|---|
| F1 | ~~major~~ **fixed** | `CreateQueryClient.ts` | Cancellations treated as failures: an externally-aborted `queryFn` rejects with `AbortError` → `toApiError` → status `0` → in `DefaultTransientStatuses` → **retried up to maxRetries**; non-revert `CancelledError`s reached the global `onError` toast. RQ's retryer runs the `retry` predicate for *any* rejection (verified `retryer.ts:170-183`); only RQ-initiated revert-cancels bypass it. | Fixed: `isCancellation()` guard (native `AbortError` + RQ `CancelledError`) short-circuits both the retry predicate and `onError`. Pinned by 2 new tests. |
| F2 | ~~minor~~ **fixed** | `UseAppLazyQuery.ts` | Stale-write races: (a) `reset()` during an in-flight `fetch()` → late settle resurrects `data`/`error`; (b) key changes between two `fetch()` calls → a slower earlier fetch clobbers newer state with a stale error. | Fixed: sequence ref — only the latest call writes state; every call's promise still settles with its own outcome. Pinned by 2 new tests. |
| M1 | major | **FIXED 2026-07-11** (deep import `../router/UseNavigationProgress`; dist grep: rrd only in `dist/router/index.js`). Was:  `dist/query/index.js:1` → `chunk-DUWGSION.js:3` | `/query` **statically imports the whole router chunk** (via `QueryProgressBridge` → `../router`), which statically imports `react-router-dom`. Any `/query` consumer needs the optional router peer installed (Vite dev doesn't tree-shake → hard resolve error); ~16KB router chunk rides along for consumers that never mount the bridge (droppable by consumer build, not by dev). Contradicts the barrel's isolation story. drydock is the app this bites today. | Defer (config-lane): split the bridge into its own entry (`/query/progress`) or import only `useOptionalNavigationProgress` from a router-free progress chunk. ~30min incl. exports map. Workaround: install `react-router-dom`. |
| M2 | major | `Persistence.ts` × `foundation/http` `reviveTemporal` | Persist + Temporal don't compose: `Temporal.*` values serialize to ISO strings (`toJSON`), restore as **plain strings** — restored cache entries have different shapes than live fetches; typed hooks then lie. | Defer: expose `serialize`/`deserialize` on `setupQueryPersistence` wired to `parseJson`. ~1h. In-code caveat added (see fixes). |
| M3 | major | **FIXED 2026-07-11** (`onError(error, { meta })` + `meta.suppressGlobalError` short-circuit on both caches). Was:  `CreateQueryClient.ts:24` (`onError` seam) | No per-query opt-out of the global error hook: `handleError` drops RQ's `(error, query)` second arg, hooks accept no `meta`. Polling queries (`useAppInfiniteQuery.refetchInterval` — transcript-forge job polling, drydock liveness) keep polling through an error state → **toast per failed poll**. Suspense failures also double-surface (toast + route error boundary). Dedupe within one failure is correct (fires once per settled failure, after retries, not per observer; a cached error replayed on remount does **not** refire — only a real refetch failure does). | Defer (API design): pass `query.meta` through (`onError?: (error, context: { meta }) => void`) + `meta` option on hooks; or an `onError` return-`false` filter. ~1-2h. Feeds the feedback-bus module. |
| M4 | major (DX) | **FIXED 2026-07-11** (`<TRaw, TData = TRaw>` flip + inference type-suite). Was:  `Endpoints.ts` × `UseAppQuery.ts:8` | Documented gap ([http-query-integration.md:86](./http-query-integration.md)): `useAppQuery({ ...def })` with no `map` infers `data: unknown` — `TData` has no inference site. Every identity read in migrating apps needs `useAppQuery<Dto[]>({...def})`. | **Assessed — recommend fixing pre-migration.** Cheapest: flip generic order to `<TRaw, TData = TRaw>` on `UseAppQueryOptions`/`useAppQuery` (+ `AppSuspenseQueryOptions`, `UseAppLazyQueryOptions`, `AppQueriesEntry`): with `map` absent TS applies the default → `data: TRaw`; with `map` present `TData` still infers from its return. Single-generic annotations (`useAppQuery<Dto[]>`) keep meaning for the identity case; only explicit *two*-generic calls swap order (none app-side yet — now is the cheap moment). ~1h incl. type tests. Alternative: no-`map` overload pair (`Omit<…,'map'>` → `TRaw`), no ordering break, ~2h. |
| M5 | major (DX) | **FIXED 2026-07-11** (`page: query.data` returned alongside `items`). Was:  `UseAppPaginatedQuery.ts:48-54` | Return surface hides the raw page: only `items` escape — total count / page count / `hasMore` (whatever `TPage` carries) are unreachable, and real pagination UIs need them. Apps would bypass the hook or double-fetch. | Defer to owner (additive API): return `page: query.data` alongside `items`. 2 lines. |
| m1 | minor (perf) | `UseAppQueries.ts:55-68` | `useQueries` returns a **fresh array every render** (verified: hook returns `getCombinedResult(trackResult())`; without `combine`, `#combineResult` returns the freshly-mapped input — `queriesObserver.ts:182,216-235`) → the `useMemo([results])` never hits; `results`/`data`/`errors` get new identities each parent render. | v5 idiom: implement aggregation via the `combine` option — RQ memoizes the combined result. ~30min. Harmless until a heavy child memoizes on these arrays. |
| m2 | minor (perf) | `UseAppQuery.ts:32` (+ paginated/infinite `mapPage`) | RQ memoizes `select` by fn reference — an inline `map` lambda re-runs select and produces a new `data` identity **every render**. The wrapper API invites inline lambdas. | App guidance (added to Verdict): hoist/`useCallback` maps. SDK-side ref-stabilizing would risk stale closures — don't. |
| m3 | minor (types) | `UseQueryCache.ts:19` | `set` updater typed `(previous) => TData` — forbids RQ's bail-out contract (`undefined` return = no-op write). | Widen to `TData | undefined` when touched. |
| m4 | minor | `CreateQueryClient.ts:35` | `RetryPolicy.onRetry` never fires at query level (RQ's retry seam has no pre-retry hook) — transport-only. Decorrelated-jitter policies also degrade slightly (the `retryDelay` seam is stateless → no `previousDelayMs`). | Docstring now says so (fixed). Behavior gap accepted. |
| m5 | minor | `Devtools.tsx:6-10` | The devtools dynamic import is unconditional in the module graph → consumer `vite build` must resolve `@tanstack/react-query-devtools` (install it; it ships as a never-fetched async chunk in prod — disk, not wire). `import.meta.env.DEV` also assumes Vite (non-Vite bundlers crash at render) — ecosystem is Vite-only, acceptable. Prod tree-shake of the *render path* verified in dist (dynamic-only, `dist/query/index.js:344`). | Migration-prereq note (above). |
| m6 | minor | `package.json` × `query/testing` | `/query/testing` imports `@testing-library/react` (external in dist) but RTL isn't declared even as an optional peer — resolve error for consumers without it. Test-only surface, apps have RTL. | Declare optional peer when touched. |
| m7 | minor | `UseAppLazyQuery.ts` | `fetch()` serves a still-fresh cache entry without a network call (client `staleTime`, 30s default — `fetchQuery` only fetches when stale; verified `queryClient.ts`). Export-on-click flows that require a fresh request per click will be surprised. | Docstring now states it (fixed). Later: optional per-call `staleTimeMs`. |
| m8 | minor (DX) | `UseAppQueries.ts:9,33` | Single `<TData, TRaw>` pair for the whole batch — heterogeneous parallel resources can't be typed; batch-wide `enabled` only. | Accepted for v1: use parallel `useAppQuery` calls; document. |
| m9 | minor (DX) | `UseAppInfiniteQuery.ts:14-20` | `pageParam`/`initialPageParam` typed `unknown` — every app `queryFn` casts. | Additive `TPageParam` generic when touched. ~20min. |
| m10 | nit | `QueryProgressBridge.tsx:13` | Heartbeat lights on hover-prefetch too (`useIsFetching` counts prefetches); bridge re-renders per in-flight count change (renders null — negligible). | Accept. |
| m11 | nit | `Persistence.ts:5` | `DefaultStorageKey 'app:query-cache'` — two SDK apps on one origin would share/clobber a cache. | Migration note: set `storageKey` (and `buster`) per app. |
| m12 | nit | hooks' `error` | Non-`ApiError` failures re-wrap per render (`toApiError` allocates); the transport client always throws `ApiError` → passthrough keeps identity stable on the real path. | Accept. |

Verified-correct (no finding): retry arithmetic (`maxRetries: 2` → 3 attempts; `retryDelay(attemptIndex+1)` 1-based mapping; mutations `retry: 0`); **no double-retry** with `createApiClient` (transport retry defaults **off** and its docstring says leave it off under `/query`); `fetchQuery`/`prefetchQuery` inherit the house retry policy (RQ's `retry=false` fetchQuery default only applies when no default is set); prefetch dedupe = in-flight promise + stale window; optimistic flow is the canonical v5 shape incl. seeded-entry removal on rollback and settle-invalidate-even-on-error (concurrent same-key rollbacks unwind LIFO — non-LIFO failure order is reconciled by the settle invalidation; pinned by test); suspense errors reach the router `AppErrorBoundary` whose recovery is navigate-away → fresh mount refetches, so no `QueryErrorResetBoundary` reset-loop exists in the house pattern; `keepPreviousData` used as v5 `placeholderData` value with `isPlaceholder` exposed; root entry is RQ-free (0 `tanstack` refs in `dist/index.js`), all 5 tanstack peers optional + external; v5.101.2 pin coherent across the 4 packages; no deprecated v5 options anywhere; barrel header accurate post-`Endpoints`/`useOptimisticMutation` (both documented, exports match); `queryKeys`/factory app-registry convention clearly documented (barrel + [http-query-integration.md](./http-query-integration.md)) — the `state-and-data.md` §Client-shape update remains open per that doc's phase 1.

## Coverage map

Unit = node project, browser = chromium project (`*.test.tsx` / `*.browser.test.ts`).

| Export | Test file | State |
|---|---|---|
| `createQueryClient` | `CreateQueryClient.test.ts` | **was 0% — added 10 tests** (defaults, transient/exhausted/non-transient/wrapped retry, abort no-retry, retryDelay wiring, onError query+mutation coercion + once-per-failure, cancellation skip) |
| `toApiError` | `ToApiError.test.ts` | **was indirect-only — added 5 tests** (passthrough identity, Error/string/unknown wrap, AbortError seam note) |
| `defineEndpoint` / types | `Endpoints.test.ts` + `Endpoints.browser.test.ts` | strong (runtime + compile-time incl. `@ts-expect-error` walls, spread into every surface) |
| `useAppQuery` | `UseAppQuery.test.tsx` | good; **added `enabled` gate test** |
| `useAppQueries` | `UseAppQueries.test.tsx` | good (batch, identity, per-entry error); gap: `enabled`, dynamic count change |
| `useAppPaginatedQuery` | `UseAppPaginatedQuery.test.tsx` | good (controlled page, placeholder hold, error); gap: `enabled` |
| `useAppInfiniteQuery` | `UseAppInfiniteQuery.test.tsx` | good (flatten, mapPage, poll-stop, error); gap: `enabled`, error-state polling behavior (M3 evidence) |
| `useAppLazyQuery` | `UseAppLazyQuery.browser.test.ts` | good; **added 2 race tests** (reset-orphan, latest-call-wins) |
| `useAppMutation` | `UseAppMutation.test.tsx` | good (passive, invalidates await, onConfirmed, error, reset) |
| `useOptimisticMutation` | `UseOptimisticMutation.browser.test.ts` | excellent (8 tests: patch/rollback/multi-target/chained/def-target/cancel/seed-removal/no-settle) |
| `useAppSuspenseQuery` | `UseAppSuspenseQuery.test.tsx` | fallback + map; gap: error→boundary integration (needs router harness — defer) |
| `useQueryCache` | `UseQueryCache.browser.test.ts` | good (round-trip, updater, invalidate, remove, prefetch, identity) |
| `usePrefetchQuery` / `prefetchProps` | `UsePrefetchQuery.browser.test.ts` | good; gap: `prefetchProps` no-op-when-unmounted path |
| `QueryProvider` | indirect (`QueryTestUtils.test.tsx` provides via raw provider) | trivial passthrough — accept |
| `QueryProgressBridge` | `QueryProgressBridge.test.tsx` | good (0↔N transitions, mutations counted, unmount close) — mock-based |
| `QueryDevtools` | `Devtools.test.tsx` | prod-null branch only (dev branch needs the package — accept) |
| `setupQueryPersistence` | `Persistence.browser.test.ts` | handle + write-on-change + default key; gap: `maxAgeMs`/`buster` restore behavior, quota path |
| testing helpers | `QueryTestUtils.test.tsx` | good |

Post-review: **18 files / 82 tests** under `src/query` (was 16/63), full unit+browser suite 72/750 — all green ×2, `pnpm typecheck` + `pnpm lint` clean.

Cheap remaining adds (deferred, ~1h total): `enabled` for queries/paginated/infinite · `prefetchProps` unmounted no-op · persistence `buster` mismatch discard.

## Nits fixed inline

1. `CreateQueryClient.ts` — cancellation guard (`AbortError` + `CancelledError`): never retried, never reaches `onError`; docstrings updated (incl. `onRetry` transport-only note). *(F1)*
2. `UseAppLazyQuery.ts` — fetch sequencing: latest call wins; `reset()` orphans in-flight settles; docstring now also states the stale-window reuse semantics. *(F2, m7 doc)*
3. `Persistence.ts` — docstring caveats: sensitive-data-in-localStorage footgun, `buster`-on-release guidance, silent quota stop, Temporal-restore shape break. *(M2 doc)*
4. New tests: `CreateQueryClient.test.ts` (10) · `ToApiError.test.ts` (5) · 2 lazy-race tests · 1 `enabled` gate test.

## S-1 swappability verdict (`/query` vs swappable-modules convention)

**Score: ~55% conformant — contract-shaped, single-adapter.** Verdict for the sweep: **contract-hygiene pass only; defer dual-adapter (MAYBE).**

| Convention rule | State |
|---|---|
| House contract first, no vendor types leaking | **Mostly met** — hooks take `{ key, queryFn, map }` and return house shapes (`data/loading/error/refetch`), not RQ result objects; `Endpoint` is a plain object. Leaks: RQ `QueryKey` in every signature (structurally `readonly unknown[]` — one-line house alias), `createQueryClient` returns a raw RQ `QueryClient` threaded through `QueryProvider`/persistence/devtools (the real coupling point). |
| 90% surface from product usage | **Met** — surface derived from the transcript-forge vendored layer + product audits ([frontend-modules-products.md](./frontend-modules-products.md)); nothing speculative. |
| Typed native escape hatch | **Not met** — no per-query passthrough (`staleTime`, `meta`, `refetchOnMount`…) and no `native` accessor; apps needing one RQ option today must abandon the hook entirely. This is the convention's sharpest miss and doubles as the M3/M5 pressure valve. |
| Behavior variants as sibling hooks, not flags | **Met exactly** — `useAppMutation` vs `useOptimisticMutation` (the convention cites this pattern). |
| Engine per subpath, optional peers, dist-verified | **Half** — RQ is an optional peer, external, root stays clean (verified); but contract and adapter are fused in one `/query` entry, and the entry leaks the *router* chunk (M1). |
| Two adapters day one | **Not met** — TanStack only; no house micro-engine. |
| Engine-agnostic conformance suite | **Not met** — tests are solid but RQ-aware in places (client spies, `CancelledError`); ~60% already behavioral and could seed `describeQueryEngineConformance`. |
| App pins engine in one re-export | **Not codified** — apps import `@wow-two-beta/ui/query` directly; add the app-local pin file to the migration guide (one line). |

**Contract-extraction cost: ~1-2 days** — (1) house `QueryKey` alias + narrow `QueryClientLike` for the provider/persistence/devtools seams; (2) move vendor-specific pieces (`createQueryClient`, `Persistence`, `Devtools`, `QueryProgressBridge`) behind a `/query/tanstack`-style adapter entry; (3) generalize the hook tests into a conformance suite. **Recommendation:** don't pay it now. TanStack Query is the engine least likely to actually swap (it is the category), suspense/infinite/persistence have no credible second engine with parity, and the wrapper already delivers the convention's practical goal — apps code against house shapes. S-1 sweep should take only the cheap hygiene: house `QueryKey` alias, **typed escape hatch** (per-query options passthrough or `native`), app-local pin-file convention in migration docs, and the M1 entry split. Re-open dual-adapter only if a real second engine (or React Cache/`use()` maturation) shows up with a consumer behind it.
