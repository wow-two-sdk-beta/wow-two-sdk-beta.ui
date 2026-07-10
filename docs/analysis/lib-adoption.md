# Library adoption scan — wrap-don't-build verdicts per domain

*Last updated: 2026-07-10*

> Which established lib (if any) each open feature domain should adopt behind a house API, following the proven pattern: **wrap-as-peer** (optional peer isolated to one subpath — `/router` carries `react-router-dom`, `/query` carries `@tanstack/react-query`; see `package.json` `peerDependenciesMeta`), **internal-dep** (regular dep consumed inside components — `@floating-ui/react`, `@radix-ui/react-focus-scope`, `lucide-react`), or **wrap-companion** (§8 separate package for heavy component domains).
>
> Inputs: [`ui-philosophy/targets.md`](./ui-philosophy/targets.md) (§8 companions · §9 locks · §10 pending) · [`frontend-modules.md`](./frontend-modules.md) (wave plan) · [`frontend-modules-products.md`](./frontend-modules-products.md) / [`-ecosystem.md`](./frontend-modules-ecosystem.md). Lib health checked against the npm registry **2026-07-10** (version · license · last publish).

---

## 1. Per-domain verdict table

| Domain | Candidates (npm 2026-07-10) | Verdict | Rationale | Wave / trigger |
|---|---|---|---|---|
| **Forms engine** | TanStack Form `1.33.1` MIT (pub 07-09) · react-hook-form `7.81.0` MIT (pub 07-10) | **wrap-as-peer** → `/forms-engine`, TanStack Form | Controlled-first + Standard Schema native fits `FormControlContext`/`FormField`; RHF's register/ref model fights controlled SDK inputs; 3rd TanStack peer = stack consistency; house add = `ProblemDetails.errors`→field mapping | **Wave 2** (#5, E#2) |
| **Drag & drop** | `@dnd-kit/core` `6.3.1` MIT (**pub 2024-12 — stale 19 mo**) · `@dnd-kit/react` `0.5.0` MIT (active, pre-1.0) · `@atlaskit/pragmatic-drag-and-drop` `2.0.1` Apache-2.0 (pub 06-17) | **wrap-as-peer** → `/dnd`, **pragmatic-d&d primary** (⚠ diverges from §10.2 — see §4) | Wrap-don't-build stands; but dnd-kit's stable core is unmaintained and its successor is 0.x, while pragmatic is active, tiny (~4.7 kB core), Trello/Jira-proven; house API absorbs its DIY a11y (keyboard alternative + `AnnouncementFn`) | LATER — first SortableList/Kanban consumer (§2.15); re-verify libs at trigger |
| **Virtualization** | `@tanstack/react-virtual` `3.14.5` MIT (pub 06-30) · `virtua` `0.49.2` MIT (active, 0.x) | **internal-dep** → `@tanstack/react-virtual` (agree §10.3 wrap; shape refined — see §4) | Headless ~4 kB hook consumed *inside* Table/Listbox/Combobox — floating-ui pattern, not an app-level peer; virtua rejected: 0.x + component-shaped DOM (fights house styling) | **P6** — Table batch 6, large-list Listbox/Select (§2.10) |
| **Tables (beyond shipped)** | `@tanstack/react-table` `8.21.3` MIT (pub 07-09) | core: **build-own (done)** — keep `dataTable`/`dataGrid` · companion: **wrap-companion** TanStack Table | Shipped components already carry the §4 delegate surface; spreadsheet-grade (column virtual, pinning, grouping, cell edit) re-implements TanStack Table — wrap it in `@wow-two-beta/ui-grid` instead | §8 trigger — haven needs spreadsheet-grade editing |
| **State management** | `zustand` `5.0.14` MIT (prism ×5 stores + whiteout already on it) · `jotai` `2.20.1` MIT | **skip module — bless zustand consumer-side** | No benchmark stack bundles a state lib (E#26); SDK ships a zustand-`StateStorage`-shaped persist adapter over `StorageBroker` in storage v2 — structural interface, **zero dep**; jotai: zero product usage | **Wave 2** (#7 storage v2) |
| **Animation / springs** | `motion` `12.42.2` MIT (active) | **build-own** — CSS + WAAPI `useFlip`/`<AnimatedLayout>` (agree §10.4) | FLIP consumers (§2.8) are bounded list/indicator reflows — WAAPI + View Transitions cover them; motion's ~30 kB+ React runtime unjustified; escape hatch: `motion/mini` (~5 kB WAAPI subset) only if a real spring consumer (Sheet momentum) lands | **P6** — layout-animation targets |
| **Charts** | `recharts` `3.9.2` MIT (pub 07-04) · visx (`@visx/*` `4.0.0` MIT, modular) · `echarts` `6.1.0` Apache-2.0 | **wrap-companion** → `ui-charts`, Recharts v3 primary | v3 fixed React-19/internals debt; declarative composition matches house component style; house add = token bridge (CSS vars → series colors, prism `usePlanPalette` precedent); visx = fallback for bespoke viz; echarts skip (canvas/imperative + bundle) | §8 trigger — haven dashboard |
| **Rich text** | `@tiptap/core` `3.27.3` MIT (active; pro extensions paid) · `lexical` `0.47.0` MIT (Meta, still 0.x) | **wrap-companion** → `ui-editor`, TipTap v3 | Headless ProseMirror + huge free-extension ecosystem; Lexical stays 0.x with API churn; pin to MIT core + free extensions only | §8 trigger — content app |
| **Code editor** | `codemirror` `6.0.2` MIT (modular, active sub-pkgs) · `monaco-editor` `0.55.1` MIT | **wrap-companion** → `ui-editor`, CodeMirror 6 | Modular/tree-shakable, themable via CSS vars; monaco = multi-MB + worker infra, breaks CSR bundle sanity | §8 trigger — with rich text |
| **i18n** | react-intl `10.1.15` BSD-3 · `@lingui/core` `6.5.0` MIT · Intl-only | **build-own** `LocaleProvider` (locked — agree §10.5 dictionary-only) | §5 plan stands: dictionary + `Intl.*` wrappers, zero lib; ICU slot = consumer-supplied formatter callback — document `intl-messageformat` (FormatJS core) as the drop-in, lingui for compile-time apps | **P6** (§2.2 NEXT, separate track) |
| **Dates UI** | Temporal polyfills: `@js-temporal/polyfill` `0.5.1` ISC (**shipped dep**; reference impl, "not production-optimized", pub 2025-03) · `temporal-polyfill` `1.0.1` MIT (fullcalendar, prod-oriented ~20 kB, pub 06-19) | **keep Temporal-only**; **swap the polyfill package** → `temporal-polyfill` | Temporal-as-value-type lock stands (§2.7 NOW); but we ship the spec-reference polyfill — the production-grade one just hit 1.0, smaller + faster, drop-in API; skip date-fns/dayjs/react-day-picker entirely | P6 polish — dep swap, no API change |
| **File upload UX** | `@uppy/core` `5.2.0` MIT · `react-dropzone` `15.0.0` MIT | **build-own** `useUploadQueue` (E#9 stands) | `FileUpload` UI + §3.7 File hooks already cover the dropzone half; uppy brings its own UI/ecosystem (fights house components); queue = concurrency + progress + `RetryPolicy` over a consumer `uploadFn` delegate (networking lock intact) | Deferred — first consumer (E#9) |
| **Command palette (data layer)** | `cmdk` `1.1.1` MIT (quiet since 2025-08) | **keep own** (shipped `CommandPalette`) | Ours is Modal/Listbox-composed + house-themed; cmdk deltas worth backfilling: **scored fuzzy re-ranking** (command-score; ours is a boolean `filter` predicate — no reorder) + **nested pages**; add optional `rankFn` delegate + page pattern when `/commands` feeds it | **Wave 3** (#8 `/commands` registry) |
| **Schema validation** | `zod` `4.4.3` MIT (+ `zod/mini`) · `valibot` `1.4.2` MIT (~1–2 kB modular) · `arktype` `2.2.3` MIT | **skip dep — target Standard Schema v1** | All three implement the spec: `/forms-engine` + `foundation/config` accept any `StandardSchemaV1` with zero SDK dep; config's default micro-validators stay own (Wave 2 #6 "zero deps"); docs recommend valibot (size) / zod (ubiquity) | Wave 2 — interface only |
| **Auth client** | `oidc-client-ts` `3.5.0` Apache-2.0 | **build-own** `/auth` (Wave 1 sanity-check: **passes**) | Backend SDK identity = BFF cookie `Mode=Api` + server-side OAuth + guest + Google ID-token — the SPA never runs the OIDC dance; oidc-client-ts is the token-in-browser model we deliberately avoid | **Wave 1** (#2) |
| **Feature flags** | `@openfeature/web-sdk` `1.9.0` Apache-2.0 (CNCF) | **build-own**, OpenFeature-*shaped* (E#4 stands) | Real SDK drags eval-context/provider lifecycle machinery for zero current vendors; shape-compatible own contract keeps a later OpenFeature bridge adapter trivial | **Wave 3** (#10) |
| **Analytics** | getanalytics.io (stale) · Segment/RudderStack (vendor) | **build-own** typed bus `/analytics` | No maintained vendor-neutral bus exists; own = typed events + explicit sink + Beacon flush, absorbs `PageViewTracker`, settles §10.9 naming; GWDNBM by construction | **Wave 3** (#10) |
| **Realtime** | — | **skip — LOCKED, reconfirmed** | §9 networking lock + E#7 unchanged as of this scan; presence/typing UI atoms shipped, transport stays consumer-side | — |
| **Undo/redo** | `zundo` `2.3.0` MIT (tiny, quiet 2024-11 but feature-complete) | **skip module — document zundo** as the blessed zustand pattern | Prism (~60 LOC hand-rolled) + zone-builder needs are zustand-store undo — zundo middleware solves it consumer-side with no SDK dep; SDK slice stays `useUndoableMutation` in `/query` (E#10) after Toaster action-toast | Consumer-side now · `/query` ext post-Toaster |

---

## 2. Top-5 highest-leverage adoptions

### 1. TanStack Form → `/forms-engine` — Wave 2

Subpath `@wow-two-beta/ui/forms-engine`; `@tanstack/react-form` as optional peer (exact `/query` pattern), every other entry stays form-lib-free.
House API: `useAppForm` binds field state into the existing `FormControlContext`/`FormField` (label/error/describedBy auto-wired), Standard Schema pass-through, and `ApiError.problem.errors` → per-field errors — the .NET validation contract closed end-to-end.
Deletes the ~500 LOC of `useState` form glue in drydock/secrets-vault/smart-qr/transcript-forge; validators remain the consumer's (§9 lock respected).

### 2. `@tanstack/react-virtual` → internal dep — P6, Table batch 6

Regular dependency (floating-ui pattern) — ~4 kB headless hook consumed inside `DataTable`/`DataGrid`/`Listbox`/`Combobox`; no new subpath, no peer burden.
House API: `virtualized` opt-in prop + `useVirtualList` re-export from `foundation/hooks` for consumer lists; keyboard nav + active-descendant stay ours.
Unblocks §2.10 NEXT and the large-list Select/Combobox cases without consumers ever learning the lib.

### 3. pragmatic-drag-and-drop → `/dnd` — LATER, first sortable consumer

Subpath `@wow-two-beta/ui/dnd`; `@atlaskit/pragmatic-drag-and-drop` (+ its hitbox/auto-scroll addons) as optional peers.
House API: `useSortable`/`useDropTarget` + `<SortableList>` recipe; SDK supplies the a11y the lib leaves DIY — keyboard move mode, `AnnouncementFn` live region (§4 delegate), drop indicators from house tokens.
Feeds SortableList reflow, KanbanBoard, DataGrid row reorder (§2.8 FLIP consumers). Re-verify candidates at trigger — if `@dnd-kit/react` has reached 1.0 by then, re-run this comparison.

### 4. TanStack Table → `@wow-two-beta/ui-grid` companion — §8 trigger

Separate package (heavy component domain); `@tanstack/react-table` as peer, house `DataGrid` rendering layer on top.
House API: same §4 delegate names (`KeySelector`, `Comparator`, `CellRenderer`…) mapped onto TanStack column defs, so upgrading from core `dataGrid` to `ui-grid` is a prop-compatible swap.
Only build when haven (or a product) demands pinning/grouping/edit-in-cell — core DataTable/DataGrid stay own and sufficient.

### 5. Recharts v3 → `@wow-two-beta/ui-charts` companion — §8 trigger (haven dashboard)

Separate package; `recharts` as peer; wrap the 6–8 chart shapes products need (line/area/bar/pie/stat-spark) as house components.
House API: theme bridge reading the 24 semantic tokens → series palette (prism `usePlanPalette` precedent), `ValueFormatter` delegates for axes/tooltips (locale-aware via `useLocaleFormatters`), empty/loading/error states from core.
visx stays the documented fallback if a bespoke viz outgrows Recharts' declarative model.

**Immediate no-subpath action**: swap `@js-temporal/polyfill` → `temporal-polyfill@1.0.1` (drop-in, production-grade, smaller); one `package.json` line + import sweep.

---

## 3. Risks

- **Maintenance**: `@dnd-kit/core` stale 19 months / successor 0.x (the §4 re-verify gate exists for this); `cmdk` quiet ~11 months (moot — keep-own); `lexical` + `virtua` still 0.x (both rejected); `zundo` quiet but tiny/feature-complete (acceptable as a consumer-side pattern).
- **React 19**: all recommended libs verified current — TanStack Form/Virtual/Table actively released this month, Recharts requires **v3** (v2 had React-19 friction), pragmatic-d&d is framework-agnostic (adapter layer only), motion N/A (not adopted).
- **Licensing**: recommendations are MIT except `@atlaskit/pragmatic-drag-and-drop` (Apache-2.0 — fine for the MIT SDK; preserve NOTICE in the companion/subpath docs). TipTap: core MIT but **pro extensions are paid** — `ui-editor` must pin to core + free extensions only. `react-intl` BSD-3 / `oidc-client-ts` + OpenFeature Apache-2.0 — all not adopted.
- **Peer-range discipline**: each new optional peer repeats the `/query` obligation — track the lib's major in `peerDependencies` and fix-forward consumers (beta-forever). One subpath per peer keeps blast radius contained; never let a peer leak into another entry (ESLint boundaries should gate `/forms-engine` and `/dnd` like `/router`/`/query`).
- **Bundle**: rejected-on-size list for the record — monaco (multi-MB + workers), echarts (canvas runtime), uppy (UI ecosystem), motion React runtime, full zod in SDK code (Standard Schema keeps us at 0 bytes).

---

## 4. Divergences from targets.md §10 (explicit)

1. **§10.2 dnd (rec: wrap `dnd-kit`) — partially disagree.** Wrap-don't-build affirmed, but the named lib is now the weaker candidate: `@dnd-kit/core` last published **2024-12** (npm, checked 2026-07-10) and the rewrite `@dnd-kit/react` is `0.5.0` pre-1.0, while `@atlaskit/pragmatic-drag-and-drop` is `2.0.1`, actively maintained, and production-proven at Trello/Jira scale. Recommend flipping the default to pragmatic-d&d, with a mandatory re-verify at build trigger (§2.15 is LATER — the landscape may move again).
2. **§10.3 virtualization (rec: wrap) — agree, shape refined.** Not an optional *peer*: it's consumed inside core components, so an unfulfilled peer would break `DataTable` at runtime. Ship as a regular **internal dep** (floating-ui precedent, ~4 kB).
3. **§10.4 animation CSS-only — agree**, evidence unchanged; `motion/mini` noted as the narrow escape hatch if a spring consumer ever materializes.
4. **§10.5 i18n dictionary-only — agree**; best-fit consumer plug-in for the ICU callback slot is `intl-messageformat` (FormatJS core) — document it, don't ship it.
5. **Non-§10 flag — Temporal polyfill package.** The shipped `@js-temporal/polyfill` (`0.5.1`, ISC, reference impl not built for production, last publish 2025-03) should be swapped for `temporal-polyfill` (`1.0.1`, MIT, production-oriented). Same Temporal API, no verdict change — a dependency-health fix.

---

*End. Companion to `frontend-modules.md` (waves) and `ui-philosophy/targets.md` (verdict authority). When a trigger fires, re-run the health check on that row before wiring the peer.*
