# Frontend App-Infrastructure Modules — Ecosystem Gap Analysis

*Last updated: 2026-07-10*

> **Question**: beyond components + `/router` + `/query`, what app-infrastructure modules should `@wow-two-beta/ui` ship so a new product gets advanced functionality at zero cost?
>
> **Method**: benchmark against what leading stacks bundle — Next.js app conventions (minus SSR), Remix utils, TanStack ecosystem (Query/Router/Form/Virtual/Devtools/Pacer/DB), RedwoodJS & Blitz app layers, Wasp, shadcn ecosystem add-ons (sonner/cmdk/vaul/RHF-zod `<Form>`/blocks), react-admin & refine provider architecture, Vercel platform SDKs (analytics / speed-insights / flags / toolbar) — then verdict each space against [`ui-philosophy/targets.md`](./ui-philosophy/targets.md).
>
> **Ground rules respected**: CSR-only React 19, Tailwind v4, beta-forever. LOCKED verdicts in targets §9 (SSR/RSC, React Native, workers, heavy media, crypto, PWA APIs, networking wrappers) are **not** re-litigated — they land in §5 "do not build".

---

## 1. Existing coverage snapshot

What the SDK already bundles (2026-07-10). This is further than most component libraries go — the gap analysis starts from here, not from zero.

| Layer | Subpath | What it covers |
|---|---|---|
| Components | `/presentation/{actions,display,feedback,forms,layout,nav,overlays}` | ~180 components incl. the *UI halves* of app-infra concerns: `Toaster`, `NotificationCenter`, `CommandPalette`, `Wizard` + `useWizard`, `FileUpload`, `Tour`, `OnboardingChecklist`, `UndoBar`, `DataTable`/`DataGrid`, `AppShell`, `PullToRefresh`, `LiveCursor`/`PresenceIndicator`/`TypingIndicator` |
| Routing | `/router` | react-router v7 wrapper: `createAppRouter` + declarative `RouteConfig`, guards (`requireAuth` + safe `returnTo` w/ open-redirect hardening), `DocumentTitle`/`DocumentMeta` (head manager), `RouteAnnouncer`, `RoutePersistence`, `PageViewTracker` (page-view analytics sink), `NavigationProgress`, typed `paths` (`definePath`) + `useTypedSearchParams`, breadcrumbs, prefetch, navigation blocker, `lazyRoute` + `reloadOnChunkError`, `AppErrorBoundary`, `NotFound` |
| Data | `/query` | TanStack Query v5 wrapper: `createQueryClient` (retry via `foundation/resilience`), `useAppQuery` family (query/infinite/mutation/batch/paginated/lazy/suspense), cache accessor, prefetch, localStorage persistence, dev-only devtools mount, `QueryProgressBridge`, `toApiError`. Passive mutations only |
| HTTP contract | `/foundation/http` | `ApiResponse`, `ProblemDetails`, `ApiError`, date brands, Temporal reviver — aligned with the .NET backend SDK error model. **An error/DTO contract, not a transport** (networking lock intact) |
| Storage | `/foundation/storage` + hooks | `StorageBroker` seam (localStorage + memory double), `usePersistentState` (cross-tab sync), `useRecentItems` |
| Resilience | `/foundation/resilience` | `RetryPolicy` (backoff · jitter · transient statuses), pure helpers — framework-free |
| Hooks | `/foundation/hooks` | `useClipboard`, `useDisclosure`, `useMediaQuery`, `useReducedMotion`, `useTypeahead`, `useDebounceHandler`, `useEscape`, `useOutsideClick`, `useFocusTrap`, `useScrollLock`, … |
| Theming | `/foundation/themes` + `themes.css/json` | OKLCH engine, curated theme registry, theme studio |

**Pattern already established** (the key architectural precedent for everything below): heavy deps are isolated as **optional peers per subpath** — `/router` carries `react-router-dom`, `/query` carries `@tanstack/react-query`; every other entry stays free of them. New infra modules should follow this subpath-peer pattern, not the §8 separate-npm-package pattern, unless the dep is genuinely heavy (charts-grade). §8 companions stay reserved for heavy *component* domains (charts, grid, editor, calendar, maps).

### What benchmark stacks bundle that we don't (raw list)

- **Next.js (CSR-relevant)**: metadata API (we have it) · typed env config · instrumentation hook · error reporting conventions
- **Vercel platform**: `@vercel/analytics` (events) · `@vercel/flags` · `@vercel/toolbar` (dev panel) · speed-insights (web vitals)
- **TanStack**: Form · Virtual (already NEXT §2.10) · unified Devtools shell · Pacer (rate-limit/queue) · DB (sync — locked out here)
- **Redwood/Blitz/Wasp**: auth client (`useAuth`, session, RBAC `hasRole`) · cells (async-state convention — partially NEXT §2.16) · uploads client
- **shadcn ecosystem**: RHF+zod `<Form>` field bindings (the one shadcn layer we lack) · blocks (login/settings pages — L6/L7 patterns, later)
- **react-admin/refine**: provider-contract architecture — `authProvider` · `accessControlProvider` · `i18nProvider` (NEXT §2.2) · `notificationProvider` · `auditLogProvider` (backend concern) · undoable mutations · CSV export · refine devtools
- **Sentry/PostHog shape**: ErrorBoundary + reporting seam · event bus · flags · session replay (locked out — GWDNBM)

---

## 2. Evaluation table

Verdict legend: **SDK-NEXT** = fits the SDK, build as a subpath module next · **COMPANION §8** = separate package per the companion pattern · **CONFLICTS-LOCKED** = collides with a LOCKED verdict, do not build · **SKIP** = doesn't earn its place · **COVERED** = already shipped · **SCHEDULED** = already verdicted NEXT in targets.md (reference, don't re-verdict).

| # | Space | Verdict | Rationale (one line) | New-product cost |
|---|---|---|---|---|
| 1 | **Forms engine / bindings** | **SDK-NEXT** as `/forms-engine` | Core lock ("no built-in validation engine", targets §9 + §2.7) blocks an *own* engine — but a bindings subpath that wraps **TanStack Form** exactly the way `/query` wraps TanStack Query is the sanctioned shape (§2.7 "we ship adapters if needed"); shadcn's RHF `<Form>` is the benchmark; killer feature: `ProblemDetails.errors` → field-error mapping from `/foundation/http` | Opt-in import + peer; fields auto-wire via existing `FormControlContext` |
| 2 | **Auth / session client** | **SDK-NEXT** as `/auth` | `/router`'s `requireAuth` literally ships with a "pass a stub today, swap the real check in later" comment, and the backend SDK identity baseline (cookie `Mode=Api`, OAuth, guest) is standardized — the client half is the single biggest zero-cost win per product (Redwood/Blitz/refine all bundle it) | Provider + endpoint config at root; guards & 401-handling become zero-config |
| 3 | **i18n provider** | **SCHEDULED** — targets §2.2 + §5 (NEXT, P6) | Locked direction already exists: `LocaleProvider` + `useLocale()` + `Intl.*` wrappers + per-component `labels`; nothing to re-verdict — build to that target | Zero (English defaults); provider only to override |
| 4 | **Feature flags** | **SDK-NEXT** as `/flags` | Portfolio play (many small launches) needs kill-switches + gradual rollout; OpenFeature-shaped minimal contract with a static/env adapter has no networking of its own (lock intact — remote adapters are consumer-supplied or ride `/query`) | Provider w/ static map = zero backend; `useFlag` + `<Flag when>` |
| 5 | **Analytics / event bus** | **SDK-NEXT** as `/analytics` | `PageViewTracker` already emits to an `onPageView` sink but custom events have no home; resolves pending decision §10.9 (canonical `onOpen`/`onClose`/`onSelect` naming → uniform ingestion); GWDNBM: explicit sink, no auto-collection, Beacon flush is sanctioned (§3.8 MAYBE) | Provider + one sink fn; zero if not mounted |
| 6 | **Error boundary + reporting hooks** | **SDK-NEXT** as `/errors` | `AppErrorBoundary` already shipped inside `/router` (reality ahead of §2.22's MAYBE) — extract standalone, add reset keys, `onError` reporting seam, global `window.onerror`/`unhandledrejection` capture; consumer plugs Sentry-shaped sink (no vendor dep) | Zero-config via router; reporting = one callback |
| 7 | **Realtime (SSE/WS abstractions)** | **CONFLICTS-LOCKED** | targets §9 "Networking — WebSocket, WebTransport, WebRTC" + §3.8 SSE SKIP; presence/cursor *UI* already ships — transport stays consumer-side | — |
| 8 | **File upload manager** | **SDK-NEXT** (thin) | `FileUpload` UI shipped, `useFile`/`useFileReader` already NEXT (§3.7); the missing piece is a `useUploadQueue` manager (concurrency, per-file progress, retry via `foundation/resilience`) taking a **consumer-supplied `uploadFn` delegate** — no transport of our own (lock intact); resumable/tus = out (heavy) | Opt-in hook; pairs with existing `FileUpload` |
| 9 | **Keyboard-shortcut / command registry** | **SDK-NEXT** as `/commands` | `CommandPalette` UI shipped but every app re-invents wiring; §2.14 already flags global shortcuts as the palette's need — registry provider + `useCommand`/`useHotkey` + scope layering + platform modifier mapping + palette adapter; user-customizable bindings stay SKIP (§2.14) | Provider opt-in; palette becomes config-free |
| 10 | **Undo/redo manager** | **SKIP** generic · **SDK-NEXT** micro: `useUndoableMutation` | Generic document undo/redo is editor territory (companion `ui-editor`); the product-grade need is react-admin-style *undoable mutations* (delayed commit + `UndoBar`/action toast) — a small `/query` extension, and Toaster's action-toast is already NEXT (§2.17) | One hook swap: `useAppMutation` → `useUndoableMutation` |
| 11 | **Wizard / flow state machines** | **SKIP** | Verdicted: §2.7 "Stepper/Wizard shipped (visual); state engine is consumer's" — `Wizard` + `useWizard` already cover linear flows; an XState-grade engine contradicts the agnostic stance | — (already covered for the common case) |
| 12 | **Permissions / RBAC UI guards** | **SDK-NEXT** (small, rides `/auth`) | refine's `accessControlProvider` benchmark: `can(action, subject)` delegate + `<Can>` gate + `requireRole` guard (mirror of `requireAuth`); keep naming distinct from §3.21's *browser* Permissions API (`usePermission` = device, this = authorization) | Delegate on AuthProvider; `<Can>` + guard = zero extra config |
| 13 | **Notification center state** | **SDK-NEXT** (thin store) | `NotificationCenter` UI shipped props-driven; missing store: read/unread, cap, grouping, persistence via `StorageBroker`, cross-tab via storage event, toast→center bridge; push/SW stays out (§2.17 SKIP + PWA lock) | `useNotificationStore` opt-in; server sync via delegate |
| 14 | **Offline / sync** | **CONFLICTS-LOCKED** (sync engine) · **SDK-NEXT** micro (online status) | Sync engines (TanStack DB / Replicache shape) sit on workers + background-sync + networking — all locked (§9); the sanctioned slice is `useOnlineStatus` (§3.8 MAYBE) + offline banner (§2.16 MAYBE) + wiring RQ's built-in `onlineManager` | Tiny; mostly free via `/query` defaults |
| 15 | **Devtools panel** | **SDK-NEXT** (dev-only) as `AppDevtools` | Trend is unified shells (TanStack Devtools, Vercel toolbar, refine devtools); we already mount QueryDevtools — one dev-only shell hosting query + router state + flags override + locale/pseudo-loc toggle + theme/density switcher; tree-shaken out of prod | One dev-only mount in `AppRoot` |
| 16 | **Telemetry naming (targets §10.9)** | **SCHEDULED** (pending decision) | Recommendation stands: canonize `onOpen`/`onClose`/`onSelect` and make `/analytics` (#5) the ingestion contract — resolve as part of that module, not separately | — |
| 17 | **Env / config** | **SDK-NEXT** (tiny, `foundation/config`) | Next's typed-env is the benchmark; all products are Vite + single-host Docker — `defineConfig(schema)` over `import.meta.env` + `window.__APP_CONFIG__` runtime override + fail-fast validation kills the copy-pasted config file per app | One schema file per app; zero deps |
| 18 | **SEO / head manager** | **COVERED** | `DocumentTitle` + `DocumentMeta` in `/router`; OG/JSON-LD extensions are low-value under the CSR lock (crawlers see the shell) — extend only on real need | Already zero-config via `AppRoot` |
| 19 | **Print / export** | **SKIP** print (targets §2.23 stands) · **SDK-NEXT** micro: CSV/download util | Print stylesheet stays out until a consumer asks; client-side `downloadFile` + delegate-based `toCsv` (react-admin ships an exporter) is a tiny foundation util with outsized product utility; PDF generation = heavy, out | Import two functions |
| 20 | **Clipboard / share** | **COVERED / SCHEDULED** | `useClipboard` DONE; Web Share `<ShareButton>` already NEXT (§3.24) | Zero |
| 21 | **PWA (install, push, SW, background sync)** | **CONFLICTS-LOCKED** | targets §9 explicit | — |
| 22 | **Web vitals / perf telemetry** | **LATER** | §2.21/§3.23 all MAYBE-LATER; if it ever lands it's an optional `/analytics` reporter, not a module | — |
| 23 | **Presence / collaboration engine** | **SKIP** | UI atoms shipped (`LiveCursor`, `PresenceIndicator`, `TypingIndicator`); engine needs a transport → networking lock; consumer wires their own | — |
| 24 | **App blocks (login/settings/dashboard pages)** | **LATER** (L6/L7 patterns) | shadcn-blocks benchmark is real but pattern-layer work should be fed by a real consumer (P7 Haven shake-out), not invented ahead of it; `/auth` (#2) makes a future `LoginPage` block trivial | — |
| 25 | **Preferences store** | **COVERED-ish** | `usePersistentState` + `RoutePersistence` + query persistence cover it; a unified `useAppPreferences` is a naming convenience — document the pattern instead of shipping a module | Zero |
| 26 | **Global state manager** | **SKIP** | No benchmark stack bundles one anymore; React 19 + RQ cache + `usePersistentState` cover app state; consumer brings zustand for the exception | — |
| 27 | **Virtualization** | **SCHEDULED** — §2.10 NEXT | Wrap `@tanstack/react-virtual` (pending decision §10.3, rec: wrap) | — |
| 28 | **Image/font optimization (next/image analog)** | **SKIP** | Build-pipeline territory; CSR + Vite handles; `Image` component exists with lazy loading | — |
| 29 | **Audit log / session replay** | **SKIP** | Audit = backend concern (backend SDK); replay violates GWDNBM + §2.21 "never auto-opt-in" | — |
| 30 | **Rate-limit / debounce / queue utilities (TanStack Pacer shape)** | **SKIP** for now | `useDebounceHandler` + `resilience` cover current needs; revisit only if `/commands` or upload queue outgrow them | — |

---

## 3. Top-10 recommended additions — ranked by leverage-per-effort

> i18n is excluded from the ranking — it is already locked NEXT with a full plan (targets §2.2 + §5) and remains the single largest gap overall. The list below is what this analysis *adds* to the roadmap.
>
> All ten follow the `/router`-`/query` architectural precedent: subpath export, heavy deps as optional peers, provider mounted once, everything else zero-config.

### 1. `/auth` — auth/session client — effort M · leverage XL

`<AuthProvider>` owning session state (fetch/refresh via configurable endpoints or delegate), `useAuth()`/`useSession()`, `signIn`/`signOut` helpers targeting the backend SDK identity baseline (cookie `Mode=Api`, OAuth, guest). Bridges: 401 from `/query`'s `ApiError` → signed-out transition; `/router`'s `requireAuth` consumes the provider by default (its stub-callback design was built for exactly this swap); `returnTo` round-trip already shipped.

### 2. `/forms-engine` — form bindings (no own engine) — effort M · leverage XL

Wrap **TanStack Form** the way `/query` wraps TanStack Query (optional peer, isolated subpath): `useAppForm` binding field state to the existing `FormControlContext`/`FormField` (labels, errors, describedBy auto-wired), Standard Schema (Zod/Valibot) pass-through, and submit-error mapping from `ProblemDetails.errors` → per-field errors — closing the loop with the .NET backend's validation contract. Ships adapters/bindings only; validators remain the consumer's (lock respected).

### 3. `/analytics` — typed event bus — effort S-M · leverage L

`<AnalyticsProvider sink>` + `useAnalytics().track(name, props)` with a typed event shape; auto page-views by absorbing `PageViewTracker`; buffered dispatch with Beacon flush on unload; canonical component-event naming (resolves targets §10.9). GWDNBM by construction: no vendor, no auto-collection, sink is an explicit function.

### 4. `/flags` — feature flags — effort S · leverage L

OpenFeature-shaped minimal contract: `<FlagProvider adapter>` + `useFlag(key, fallback)` + `<Flag when>` gate. Default adapters: static map + env (`import.meta.env`); remote evaluation stays a consumer-supplied adapter (or rides `/query`) — no networking of our own. Kill-switches and staged rollouts for the whole product portfolio at near-zero cost.

### 5. `/commands` — hotkey + command registry — effort M · leverage L

`<CommandRegistry>` provider, `useCommand({ id, keys, run, scope, when })`, `useHotkey`, scope layering (modals suspend page scope), platform modifier mapping (reuses `KbdShortcut`'s glyph logic). One adapter renders the registry into the shipped `CommandPalette` — every product gets Cmd-K + consistent shortcuts by registering commands, zero palette wiring.

### 6. `/errors` — error boundary + reporting seam — effort S · leverage M-L

Extract `AppErrorBoundary` from `/router` into a standalone `<ErrorBoundary fallback onError resetKeys>`, add `useErrorHandler`, global `window.onerror` + `unhandledrejection` capture, and a single `ErrorSink` contract consumers point at Sentry/PostHog/console. Router re-exports for zero-config; promotes §2.22 from MAYBE with evidence (it already ships).

### 7. `foundation/config` — typed env/runtime config — effort S · leverage M

`defineConfig(schema)`: validates `import.meta.env` at boot (fail-fast, typed access), merges `window.__APP_CONFIG__` for the single-host Docker deploys all products use, distinguishes build-time vs runtime keys. Kills the per-app hand-rolled `config.ts` and the silent-undefined-env class of bugs.

### 8. Notification store — `useNotificationStore` — effort S-M · leverage M

State half of the shipped `NotificationCenter`: add/read/unread/dismiss/cap/group, persisted through `StorageBroker`, cross-tab sync via the storage event (pattern already proven in `usePersistentState`), optional toaster bridge (toast severity ≥ X also lands in the center). Server-backed feeds plug in via delegate; no push (locked).

### 9. `useUploadQueue` — upload manager — effort M · leverage M

Queue manager over the shipped `FileUpload`: concurrency limit, per-file progress/cancel, retry via `foundation/resilience`'s `RetryPolicy`, aggregate state for UI. Transport = consumer-supplied `uploadFn(file, { signal, onProgress })` delegate — respects the networking lock; slots into `/query` mutations naturally. Resumable/tus explicitly out.

### 10. `AppDevtools` — unified dev-only panel — effort M-L · leverage M

Dev-only shell (tree-shaken in prod) hosting: existing QueryDevtools, router state (current route/params/guards), `/flags` overrides, locale + pseudo-loc toggle (feeds the i18n P6 work), theme/density switcher. Matches the TanStack Devtools / Vercel toolbar direction; one mount in `AppRoot` gives every product the same debugging cockpit.

**Near-misses** (build opportunistically, no ranking slot): `useOnlineStatus` + offline banner + RQ `onlineManager` wiring (tiny, fold into `/query` polish) · `useUndoableMutation` (fold into `/query` once Toaster's action-toast lands) · CSV/download foundation util.

---

## 4. Suggested build order (dependency-aware)

`foundation/config` (#7, no deps) → `/errors` (#6, extraction) → `/analytics` (#3, absorbs PageViewTracker) → `/auth` (#1) → RBAC gates (rides #1) → `/flags` (#4) → `/forms-engine` (#2) → `/commands` (#5) → notification store (#8) → `useUploadQueue` (#9) → `AppDevtools` (#10, wants flags+locale to exist first).

---

## 5. Conflicts with LOCKED verdicts — do not build

Explicit list so future scope conversations don't re-open these (source: targets §9 unless noted):

- **Realtime abstractions** — SSE hooks (§3.8 SKIP), WebSocket/WebTransport/WebRTC wrappers. UI atoms for presence/typing exist; transport is the consumer's.
- **Fetch/HTTP transport wrapper** — `/foundation/http` is an error/DTO *contract* and must stay that way; `/query` wraps the data lib, never the wire.
- **Offline sync engine** — service workers, Background Sync, TanStack-DB/Replicache-shaped local-first stores (workers + PWA + networking locks combined).
- **Push notifications** — §2.17 SKIP + PWA lock.
- **Own validation engine / built-in validators** — §9 + §2.7. `/forms-engine` ships bindings over a peer engine only.
- **Print stylesheet** — §2.23; "single user request away", but that request hasn't come.
- **Web Crypto utilities** — §9.
- **SSR/RSC anything** — hydration helpers, streaming, `ClientOnly`-style utils have no meaning here. §1.12/§2.25.
- **React Native / cross-platform** — §9.
- **Heavy media pipelines** — recording, MSE, WebCodecs. §9.
- **PWA surface** — manifest, install prompts, launch handlers, window controls. §9.
- **Session replay / heatmaps / auto-collection analytics** — §2.21 "never auto-opt-in" + GWDNBM product principle.
- **User-customizable keybindings** — §2.14 SKIP; `/commands` ships fixed bindings with platform mapping.
- **Component swap DI registry** — §2.20 SKIP; consumers wrap.
- **Multi-brand build-time theming** — §2.3 SKIP.

---

## 6. Tensions found with targets.md (doc debt, not verdict changes)

targets.md is scoped as a *component-library* catalog and now lags the SDK's app-infrastructure reality. None of these are verdict violations — the locks' spirit held — but the letter is stale:

1. **"Consumer's router" is us now.** §2.8 (page transitions), §3.22 (History API) say "SKIP — consumer's router", yet `/router` ships and owns react-router. The lock's intent (don't build an own router/transport) held — we wrapped, isolated the peer — but the wording predates the layer.
2. **§3.8 "Fetch — SKIP — consumer brings TanStack Query"** — the SDK now *is* the TanStack Query bringer (`/query`), plus `/foundation/http` ships the error contract. Consistent in spirit; the row reads wrong.
3. **§2.21 telemetry LATER vs shipped `PageViewTracker`; §2.22 error boundary MAYBE vs shipped `AppErrorBoundary`** — reality is ahead of the doc in both rows.
4. **§8 companion table has no app-infra pattern.** It only lists heavy component packages. The `/router`-`/query` subpath-with-optional-peer pattern is the proven vehicle for infra modules and deserves codification alongside §8.
5. **`/forms-engine` gating.** §2.7 says "ship adapter only if real consumer asks" — smart-qr / drydock / transcript-forge each hand-wire form validation today; whether that satisfies the gate is the user's call, flagged here rather than assumed.

**Recommended doc action** (when the user agrees): add an "App infrastructure" section to targets.md (or a pointer to this doc) with verdicts for `/router`, `/query`, `/auth`, `/flags`, `/analytics`, `/commands`, `/errors`, `/forms-engine`, config — and refresh rows 1–3 above. Sync `ideas.md` per the paired-source-of-truth rule.

---

*End. Companion to `ui-philosophy/targets.md` — that file stays the verdict authority for component-library vectors; this file maps the app-infrastructure layer above it.*
