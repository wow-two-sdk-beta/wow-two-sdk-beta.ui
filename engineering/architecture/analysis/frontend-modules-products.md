# Frontend SDK modules — driven by what products hand-roll

*Last updated: 2026-07-10*

What `@wow-two-beta/ui` should ship next, derived from auditing every active product frontend in the workspace. Method: read the SDK's current surface (`src/router`, `src/query`, `foundation/{http,storage,resilience,hooks}` barrels + `package.json` exports), then inventoried each product's hand-rolled app-infrastructure. Every row cites files actually read.

**SDK baseline (v0.0.89):** presentation groups (actions/display/feedback/forms/layout/nav/overlays) · `/router` (createAppRouter, definePath typed paths, guards + returnTo, lazyRoute, prefetch, nav progress, DocumentTitle/Meta, RoutePersistence, PageViewTracker, AppErrorBoundary via root) · `/query` (createQueryClient + retry policy, useAppQuery/Mutation/Queries/Paginated/Lazy/Infinite/Suspense, cache accessor, prefetch, localStorage persistence, devtools, progress bridge — **passive mutations only**) · `foundation/http` (**types + `ApiError` + `parseJson`/temporal reviver only — no fetch client**) · `foundation/storage` (StorageBroker + localStorage/memory impls) · `foundation/resilience` (RetryPolicy, backoff/jitter) · `foundation/hooks` (usePersistentState, useRecentItems, useClipboard, useDebounceHandler, …).

Audited products (7): drydock, secrets-vault, smart-qr, transcript-forge, prism, whiteout (game + zone-builder + lookdev), arcade. Not auditable: **hijinx** (`ventures/ventures.hijinx/` = README-only stub, no code), fun-vault (content repo, no app).

---

## 1. Per-product inventory

### 1.1 drydock — `wow-two-platform.drydock/engineering/codebase/drydock.frontend-services/`

Pins `@wow-two-beta/ui` **0.0.68**. No router, no query lib — single-screen SPA, ~1,500 LOC. Uses SDK components heavily.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| Fetch API client: `ApiError` class, ProblemDetails parse (`toApiError`), `request`/`requestData` envelope unwrap, JSON headers, AbortSignal plumbing, `loginUrl` | `src/api/client.ts` (165 LOC) | **api-client** (`foundation/http` fetch client) |
| Auth/session hook: `/identity/me` resolve with module-level StrictMode dedupe, OAuth-redirect `signIn`, `signOut` + cache drop | `src/hooks/useAuth.ts` (60 LOC) | **auth/session** |
| Query-shaped data hooks: manual `useState` loading/error/reload + create/update/remove mutators that refetch | `src/hooks/useProducts.ts` (64), `useServers.ts` (35), `useProductVersion.ts` (37 — abortable lazy per-row fetch) | `/query` **adoption** |
| Form state + validation glue: 8× `useState` per form, inline repo-input validation, `submitting`/`error` + inline `Alert` | `src/components/RegisterProductForm.tsx` (177; state at 34–41), `RegisterServerForm.tsx` (91) | **form-state glue** |
| Liveness polling: `connection` state off `getStatus` | `src/App.tsx:36` | `/query` adoption (refetchInterval) |
| Absent entirely: error boundary, toasts (inline Alert only), env wrapper (same-origin) | `src/App.tsx`, `src/main.tsx` | error-boundary export · feedback bus |

### 1.2 secrets-vault — `wow-two-platform.secrets-vault/engineering/codebase/secrets-vault.frontend-services/`

Pins `@wow-two-beta/ui` **0.0.68**. No router, no query lib. `src/api/client.ts` is a **near-verbatim copy of drydock's** — the duplication is already happening organically.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| Fetch API client (drydock copy) **+ bearer-token injection + settable 401 handler** | `src/api/client.ts` (204 LOC; `setAuthToken`/`setUnauthorizedHandler`/`Authorization` at 66–89) | **api-client** (with auth hooks) |
| Auth context: in-memory admin token (deliberately not persisted), login/logout, 401 → drop to gate; gate component | `src/auth/AuthContext.tsx` (57), `src/auth/AuthGate.tsx` (9) | **auth/session** (bearer mode) |
| Query-shaped roster hook + last-selected namespace in raw `localStorage` | `src/hooks/useNamespaceRoster.ts` (76; raw localStorage at 7–20) | `/query` adoption + `usePersistentState` adoption |
| Clipboard copy with failure fallback (SDK `useClipboard` exists but pin predates it/unused) | `src/components/TokenRevealModal.tsx:26,76` | adoption |
| Error banner component; manual form state (`SetSecretForm`, `LoginForm`) | `src/components/ErrorBanner.tsx`, `SetSecretForm.tsx`, `LoginForm.tsx` | Alert adoption · **form-state glue** |

### 1.3 smart-qr — `ventures/smart-qr-poc/engineering/codebase/smartqr.frontend-services/`

Pins `@wow-two-beta/ui` **0.0.89**, raw `react-router-dom@7` (not SDK `/router`), no query lib. The most complete product (~6k LOC); already consumes `foundation/http` types + `parseJson` and `foundation/storage` broker (emoji recents) — but everything *above* those seams is hand-rolled.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| API client glue: `readData` envelope unwrap, `problemError`, **validation-errors → human message** (own `errors[]` shape + ASP.NET ModelState shape) | `src/integration/common/client.ts` (48; problemMessage at 25–35) | **api-client** (incl. problem→message) |
| Per-endpoint fetch boilerplate — every function repeats `fetch` + `credentials:"include"` + `problemError` + `readData` | `src/integration/codes/codes.ts` (94; 7 endpoints), `identity/identity.ts` (46), `billing/billing.ts` (36) | **api-client** (client factory kills the repetition) |
| Env/config access: `API_BASE`, `REDIRECT_BASE`, `GOOGLE_CLIENT_ID` raw off `import.meta.env` | `src/integration/common/client.ts:8–13` | **env/config** |
| Auth/session gate: checking→gate→ready status machine on `/identity/me`, guest pass-through, sign-out; Google ID-token exchange button; `GoogleOAuthProvider` at root | `src/bootstrap/AppLayout.tsx` (28–58), `src/presentation/identity/components/GoogleSignInButton.tsx` (40), `src/bootstrap/main.tsx` | **auth/session** (cookie + guest + Google strategy) |
| Page meta/SEO: `usePageMeta` title + description/OG upsert, used across 6 marketing screens | `src/presentation/common/meta.ts` (26) | `/router` DocumentTitle/Meta **adoption** (or standalone export) |
| ScrollToTop on route change | `src/presentation/common/components/ScrollToTop.tsx` (12) | `/router` adoption (scroll restoration built in) |
| List screen state: manual fetch + 250 ms hand-rolled debounce + busy-row + **optimistic delete** (filter-out, no rollback) | `src/presentation/codes/common/listCodes/screens/CodesListScreen.tsx` (239; state 32–37, debounce 52–56, optimistic 77) | `/query` adoption + **optimistic mutation** |
| Form state: ~20 `useState` fields on one screen + client-guard validation + `saving`/`saved`/`error` + inline Alert | `src/presentation/codes/common/createCode/screens/CreateCodeScreen.tsx` (338; state 74–97, guard 170, alert 317) | **form-state glue** |
| Stripe checkout/portal redirect glue | `src/integration/billing/billing.ts` (36) | single-product — stays app-side |
| Absent: error boundary, toast wiring (inline Alert only) | `src/bootstrap/main.tsx` | error-boundary export · feedback bus |

### 1.4 transcript-forge — `ventures/10x-ventures-transcript-forge/engineering/codebase/transcript-forge.frontend-services/`

Pins `@wow-two-beta/ui` **^0.0.89** + **raw `@tanstack/react-query@5`**. The proof case: it **vendored an entire query layer + resilience module that have since shipped as SDK `/query` and `foundation/resilience`** — the same extraction pipeline should now pull the modules below. Uses SDK `/router` (createAppRouter, definePath, lazyRoute) — the only product that does.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| Vendored query layer — 16 modules mirroring SDK `/query` file-for-file (CreateQueryClient, UseAppQuery/Mutation/Queries/Paginated/Lazy/Infinite/Suspense, UseQueryCache, UsePrefetchQuery, Persistence, Devtools, QueryProgressBridge, ToApiError, QueryKeys) | `src/bootstrap/query/` (~700 LOC; barrel comment: "matures then combines into the front SDK") | **delete → `/query` adoption** |
| Vendored resilience (RetryPolicy, RetryDelay, Backoff/JitterStrategy) | `src/foundation/resilience/` (~127 LOC) | delete → `foundation/resilience` adoption |
| API client: raw fetch, env base URL, manual error normalization to a **bespoke `ApiError { error }`** shape (ignores SDK ApiError/ProblemDetails) | `src/integration/transcripts/Api.ts` (30; env at 4, error at 18–27), `src/domain/transcripts/Types.ts:62–65` | **api-client** |
| Concurrency limiter: promise pool with max-cap, per-item start/resolve/reject hooks, AbortSignal | `src/application/common/Concurrency.ts` (35) | **async utils** (S; pairs with job runner) |
| Client-side batch job runner: queued/running/done/failed machine, AbortController lifecycle, 250 ms elapsed-time ticker, aggregate stats | `src/application/transcripts/UseTranscriptBatch.ts` (151; ticker 42–52) | async utils / stays app-side |
| File download: Blob → objectURL → anchor-click `downloadFile`, txt/json exporters, filename builder | `src/presentation/common/Download.ts` (63; downloadFile 4–18) | **file-transfer** |
| Formatting: C# TimeSpan→ms parse, colon/human durations, USD currency, truncate | `src/presentation/common/Format.ts` (70) | **format utils** |
| Form validation glue: URL parse/validate/dedupe validators + 4× useState controlled form | `src/presentation/transcripts/BatchForm.tsx` (validators 181–211) | **form-state glue** |
| Raw `localStorage` read of `app:lastRoute` (writer is SDK RoutePersistence — read bypasses the broker) | `src/bootstrap/routes.tsx:6–15` | storage adoption |
| Env raw in 3 spots (no typed wrapper) | `src/bootstrap/main.tsx:17`, `src/bootstrap/query/Devtools.tsx:14`, `src/integration/transcripts/Api.ts:4` | **env/config** |
| Toast wiring wanted but unbuilt — `// wire a toast here` in the query-client error hook; errors just `console.error` in dev | `src/bootstrap/query/CreateQueryClient.ts:14` | **feedback bus** |
| SVG progress ring (SDK ProgressCircle exists) | `src/presentation/common/UsageRing.tsx` (70) | adoption |

### 1.5 prism — `ventures/10x-ventures-prism/engineering/codebase/prism.frontend-services/`

Pins `@wow-two-beta/ui` exact **0.0.62**; zustand ^5 (5 stores); fully offline (no API/auth — those absences are legitimate). ~28k LOC 2D-plan + 3D room modeler. R3F/geometry internals are domain code, not SDK candidates.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| localStorage persistence cluster: manual body read/write/delete keyed `prism.project.<id>` + zustand `persist` for project index and render settings | `src/shared/projectIo.ts` (46), `src/state/useProjectStore.ts` (135), `src/state/useRenderStore.ts` (51) | **storage v2** (broker adoption + zustand adapter) |
| Storage migrations: one-time key rename, single-doc→multi-project seed, versioned `migrateModel` v1→v3 + shape validator | `src/shared/migrateStorageKey.ts` (17), `src/shared/migrateToProjects.ts` (89), `src/shared/documentIo.ts` (~70) | **storage v2** (versioned keys + migrate hooks) |
| Debounced autosave: 800 ms store-subscribe debounce + `beforeunload` flush | `src/features/editor/useProjectAutosave.ts` (39), `src/state/useAppStore.ts` (`flushActiveProject`) | **storage v2** (autosave helper) |
| Undo/redo: past/future full-doc snapshots, `HISTORY_LIMIT=50` | `src/state/useModelStore.ts` (~60 of 968) | history util (single product — LATER) |
| Keyboard shortcuts: global keydown (tools V/D/B/M/G, Esc, Delete, ⌘Z/⇧⌘Z) with input-focus guard + `TOOL_DEFINITIONS` shortcut registry | `src/app/useEditorShortcuts.ts` (83), `src/features/toolbar/Toolbar.tsx` | **shortcuts** |
| File export/import: Blob/anchor `download()`, SVG/PNG/PDF export, JSON export + hidden-input import with validation | `src/features/drawings/exportDrawing.ts` (64), `src/shared/documentIo.ts` (~32) | **file-transfer** |
| Theming glue: reads ~18 CSS custom props via `getComputedStyle` into a JS palette (rAF re-read on mode change); dual token-bridge CSS layer; hardcoded 3D scene colors | `src/features/plan/usePlanPalette.ts` (99), `src/index.css` (~190), `src/features/scene/Scene3D.tsx` (`SCENE_COLORS`) | tokens→JS helper (S — canvas/SVG/3D consumers) |
| Hand-rolled view routing: zustand `view` field gallery↔editor + boot reopen | `src/app/App.tsx`, `src/state/useAppStore.ts` (54) | `/router` adoption (light) |
| Micro-utils duplicating SDK: `cn` (clsx+tailwind-merge), `useElementSize` ResizeObserver hook, uuid wrapper | `src/shared/cn.ts` (7), `src/shared/useElementSize.ts` (29), `src/shared/ids.ts` (4) | foundation adoption |

### 1.6 whiteout — `ventures/whiteout/engineering/codebase/` (game + zone-builder + lookdev)

**No `@wow-two-beta/ui` dependency in any of the three apps** (deps: react, three, R3F, zustand, `@whiteout/engine`). Engine internals (renderer, physics, materials, pointer-lock FpsController at `whiteout.engine/src/controls/FpsController.tsx:67`) are domain code. App-shell infra is thin but repeats a pattern:

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| Keyboard input/shortcuts — **5+ separate raw `window.addEventListener('keydown')` sites, each re-implementing the typing-target guard**: engine movement keys (hard-coded WASD map, no remap/persist), editor gizmo keys, 3 more scattered Esc/Enter/Backspace listeners, map-toggle (M/Escape), throw/grab F/E/G | `whiteout.engine/src/controls/useKeyboard.ts` (73), `whiteout-zone-builder.../src/app/useGizmoShortcuts.ts` (73; listener 62–63) + `EditorScene.tsx` (~3 more listeners), `whiteout.frontend-services/src/game/map/mapStore.ts:28`, `src/game/PhysicsSandbox.tsx:304` | **shortcuts** |
| Settings/preset persistence — lookdev's raw `localStorage` JSON presets with hand-versioned `-v2` key + try/catch: textbook StorageBroker/`usePersistentState` fit | `whiteout-lookdev.frontend-services/src/app/presets.ts` (37) | **storage v2** / broker adoption |
| Screen/HUD state: ad-hoc `useState`/zustand screen booleans (no FSM), perf-HUD rAF FPS counter, map modal | `whiteout.frontend-services/src/app/App.tsx` (81), `src/app/PerfHud.tsx` (32), `src/game/map/mapStore.ts` (52) | stays app-side |
| Asset loading: imperative `GLTFLoader().load` + promise-cache-by-id, `console.warn` on failure, no progress UI — same pattern at 4 sites across the 3 apps | `whiteout.frontend-services/src/game/outpost/CrateModel.tsx` (41), `whiteout-zone-builder.../src/bundle/presetObjects.ts` (72), `whiteout-lookdev.../src/app/subjects.tsx:71,160` | R3F-domain — observation only |
| Zone-builder editor store: selection/gizmo/placement machine — **no undo/redo, no persistence, no zone save/export** (engine declares `SerializeZone`/`DeserializeZone` types at `whiteout.engine/src/runtime-types.ts:208–212`, nothing implements them); one-shot manifest `fetch` + mock fallback, hardcoded URL | `whiteout-zone-builder.../src/state/editorStore.ts` (792), `src/app/App.tsx` (92) | future adopter: file-transfer, history, storage, api-client |
| Hand-rolled form/control widgets (sliders, segmented buttons, color rows, clamped number inputs) + schema-driven property inspector | `whiteout-zone-builder.../src/app/panels/PresetInspector.tsx` (602), `PlacementModeBar.tsx` (137), `whiteout-lookdev.../src/app/Panel.tsx` (242) | SDK forms-components adoption |
| Absent in all 3 apps: error boundary (bare `createRoot` renders), toasts, theming tokens, env/config, analytics | `whiteout.frontend-services/src/main.tsx`, `whiteout-zone-builder.../src/main.tsx` (7 each) | future adopter of feedback bus/config |

### 1.7 arcade — `ventures/ventures.arcade/engineering/codebase/arcade.frontend-services/`

Bare scaffold: 78 LOC total, **no SDK dependency**, no router/query/state lib.

| Hand-rolled | Evidence | SDK-module candidate |
|---|---|---|
| Raw `fetch('/api/greeting')` + AbortController + manual `res.ok`→throw + message/error useState | `src/App.tsx` (~20 of 63) | **api-client** + `/query` from day one |

---

## 2. Cross-product frequency ranking

| Rank | Hand-rolled concern | Products (count) | Duplicated LOC (approx) |
|---|---|---|---|
| 1 | **API client over fetch** (ApiError build, ProblemDetails parse, envelope unwrap, headers, abort, base URL) | drydock · secrets-vault (near-verbatim copy of drydock's) · smart-qr · transcript-forge · arcade (**5**) | ~640 |
| 2 | **Form state + validation glue** (N× useState, inline validators, submitting/error, inline Alert) | drydock · secrets-vault · smart-qr · transcript-forge (**4**) | ~500 (state portions) |
| 3 | **Query-shaped data fetching** (manual loading/error/reload hooks, or a vendored query layer) | drydock · secrets-vault · smart-qr · arcade hand-roll; transcript-forge vendored ~830 LOC now shipped as SDK `/query`+resilience (**5**) | ~1,100 |
| 4 | **Auth/session client** (me-resolve → gate → signIn/signOut; three transport flavors: cookie+OAuth redirect / in-memory bearer / cookie+guest+Google ID token) | drydock · secrets-vault · smart-qr (**3**) | ~270 |
| 5 | **localStorage beyond the broker** (raw reads, versioned keys/migrations, zustand persist, autosave) | secrets-vault · transcript-forge · prism · whiteout-lookdev (**4**) | ~490 (prism ~400) |
| 6 | **Keyboard shortcuts** (raw window keydown + copy-pasted typing-target guards + per-app registries — 5+ listener sites in whiteout alone) | prism · whiteout game · whiteout zone-builder (**3 products, ~7 sites**) | ~250 |
| 7 | **Env/config access** (raw `import.meta.env`, no typing/validation) | smart-qr · transcript-forge · arcade-implicit (**3**) | ~30 (small but every new product re-decides it) |
| 8 | **Toast/error feedback wiring** — nobody has it; all five API products show errors as inline Alerts; transcript-forge left a `// wire a toast here` TODO | wanted in 4+ (**0 built — universal gap**) | n/a |
| 9 | **File download/import** (Blob→anchor save-as, JSON import pickers, exporters) | transcript-forge · prism (· zone-builder next) (**2+1**) | ~160 |
| 10 | **Optimistic updates / undo** (SDK query is passive-only) | smart-qr (optimistic delete, no rollback) · prism (undo/redo stack) (**2**) | ~90 |
| 11 | Formatting utils (durations, currency, truncate) | transcript-forge · prism-scattered (**2**) | ~80 |
| 12 | Page meta/SEO (title + OG upsert) | smart-qr (**1** — but router DocumentMeta already exists; adoption blocked on router migration) | ~26 |
| 13 | Error boundary | **0 of 7** have one outside SDK-router usage | n/a |

Also observed, adoption debt rather than missing modules: version pins scatter (0.0.62 / 0.0.68 / 0.0.89) · whiteout + arcade consume no SDK at all · SDK components already cover hand-rolls (transcript-forge `UsageRing` → ProgressCircle · secrets-vault `ErrorBanner` → Alert, raw `navigator.clipboard` → useClipboard · prism `cn`/`useElementSize` → foundation utils/hooks).

---

## 3. Top-10 module proposals

| # | Module | Scope (one line) | Immediate adopters | Size |
|---|---|---|---|---|
| 1 | `foundation/http` **api-client** | `createApiClient({ baseUrl, auth, onUnauthorized })` → typed `get/post/put/del`: JSON headers, AbortSignal, `ApiResponse` envelope unwrap, ProblemDetails→`ApiError` with validation-errors→message (smart-qr's `problemMessage` covers both `errors[]` and ModelState shapes), temporal reviver, bearer/cookie modes, 401 hook, network-failure normalization. Kills 5 divergent copies; feeds `/query` `queryFn`s directly. | drydock, secrets-vault, smart-qr, transcript-forge, arcade | **M** |
| 2 | `auth` **session module** | Headless `AuthProvider`/`useAuth` over a me-endpoint: checking→gate→ready machine, StrictMode-deduped session resolve, signIn/signOut, 401→signed-out wiring into api-client, strategies (OAuth redirect · in-memory bearer · cookie + guest + Google ID-token exchange), plugs into router `requireAuth`/returnTo. Optional gate/screen shells later. | drydock, secrets-vault, smart-qr | **L** |
| 3 | `forms` **form-state glue** | `useAppForm`: values/errors/submitting/submitError, field binding for SDK inputs, validator combinators, and `ApiError` validation-errors → per-field errors. Deliberately light (targets.md verdict: no validation engine) — this is the glue every product rewrites, not RHF. | drydock, secrets-vault, smart-qr, transcript-forge | **M/L** |
| 4 | `query` **optimistic mutation** | `useOptimisticMutation`: snapshot → cache patch → rollback on error → invalidate, plus list helpers (remove/toggle row). Closes the "passive mutations only" gap the products are already working around by hand. | smart-qr (delete/toggle), drydock (roster mutators), prism-style undo later | **S/M** |
| 5 | **feedback bus** (`feedback/notify`) | App-level `notify.success/error/info` + `onQueryError` bridge wiring `ApiError` → SDK `Toaster` (dedupe, retry action, offline banner hook). Fills the transcript-forge TODO and replaces inline-Alert-only UX in every API product. | transcript-forge, drydock, secrets-vault, smart-qr | **S/M** |
| 6 | `foundation/config` **typed env** | `defineConfig(schema)` over `import.meta.env`: typed, defaulted, fail-fast at boot, test-overridable — one place for `VITE_API_BASE` / client IDs instead of scattered raw reads. | smart-qr, transcript-forge, arcade (+ every `create-repo` stamp) | **S** |
| 7 | `foundation/storage` **v2: versioned + adapters** | Versioned keys with `migrate` hooks (prism's v1→v3 model migrations, key renames; lookdev's hand-versioned `-v2` preset key), debounced autosave + `beforeunload` flush helper, and a zustand `persist` storage adapter over `StorageBroker`. | prism (~400 LOC), secrets-vault (last-selected), transcript-forge (lastRoute read), whiteout-lookdev (presets) | **M** |
| 8 | `shortcuts` **hotkey registry** | Scoped global shortcut layer: declarative `useShortcuts({ 'mod+z': … })`, input-focus guard (copy-pasted by hand at 5+ whiteout sites today), platform modifier mapping, conflict-safe layers (editor vs overlay), registry that can later feed CommandPalette + KeyboardShortcut display. | prism, whiteout game, whiteout zone-builder, showcase | **M** |
| 9 | `foundation/files` **file transfer** | `downloadFile` (Blob→anchor), `downloadJson`/`downloadText`, `pickFile`/`importJson` with shape validation — the export/import ritual both document-shaped apps hand-roll (and zone-builder needs but hasn't built: engine codec types unimplemented). | transcript-forge, prism; zone-builder (zone export) next | **S** |
| 10 | `foundation/format` **format utils** | Intl-based duration (incl. C# `TimeSpan` parse — a backend-SDK artifact every .NET-backed product will meet), relative time, currency, truncate. | transcript-forge, prism; every dashboard after | **S** |

**Not new modules — adoption debt to schedule alongside:** migrate drydock/secrets-vault/smart-qr to `/query` (their manual hooks are the module's exact use case) and smart-qr to `/router` (gets DocumentMeta, ScrollToTop-for-free, AppErrorBoundary — deletes `meta.ts` + `ScrollToTop.tsx`); delete transcript-forge's vendored `bootstrap/query/` + `foundation/resilience/` (~830 LOC) now that the SDK ships both; converge version pins (0.0.62 / 0.0.68 / 0.0.89 → current); swap per-product duplicates for existing SDK pieces (`UsageRing`→ProgressCircle, `ErrorBanner`→Alert, raw clipboard→`useClipboard`, `cn`/`useElementSize`→foundation).

**Sequencing note:** #1 api-client unblocks #2 auth (token/401 wiring) and #5 feedback bus (ApiError shape), and makes `/query` adoption mechanical — build it first. transcript-forge's vendor-then-extract history (`src/bootstrap/query/index.ts` barrel: "matures then combines into the front SDK") is the working pipeline: the api-client and auth modules are at exactly that maturity point today, hand-rolled in 5 and 3 products respectively.
