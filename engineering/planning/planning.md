# Planning — iterations & tasks

*Last updated: 2026-07-11*

> The single iteration/task registry for this repo — every vector's status lives HERE; the `../architecture/analysis/*.md` files are deep-analysis reference,
> `../architecture/testing.md` keeps its own detailed iteration table (linked). One row per iteration: compact, current, no history prose (git has history).

## Vectors

> Full vector index (shipped modules + cross-cutting + possible-unbuilt) → [`vector-registry.md`](../architecture/vector-registry.md). The table below is the active/tracked subset.

| Vector | Deep reference | Status |
|---|---|---|
| Components (P3 build-out) | [`component-catalog.md`](../architecture/component-catalog.md) (index) · `../architecture/analysis/ui-philosophy/targets.md` + roadmap | organisms done; P6 refactor vectors NEXT |
| Testing layer | [`testing.md`](../architecture/testing.md) (own iteration table, It1–10 done) | live — 1550 tests; a11y contrast tail deferred |
| Infra modules (waves) | [`analysis/frontend-modules.md`](../architecture/analysis/frontend-modules.md) | Wave 1 done · Wave 2 **done** (forms-engine · `foundation/config` · storage v2 incl. zustand-persist) · Wave 3 NEXT |
| Forms / fields / validation | [`analysis/forms-engine.md`](../architecture/analysis/forms-engine.md) | **COMPLETE** — engine + 2 adapters + 114-case conformance + all fields wired + 3 product proofs + [completeness map](../architecture/analysis/forms-completeness.md) (34 shipped · 0 ship-now) |
| Lib adoption | [`analysis/lib-adoption.md`](../architecture/analysis/lib-adoption.md) | verdicts set; consumed per-wave |
| Theming | `THEMES.md` | engine + 183 themes; smart-qr AA exception pinned |

---

## Iterations — active / queued

| It | Vector | Tasks (one-liner) | Status |
|---|---|---|---|
| W2-a | modules | `/forms-engine`: contract + `house` + `tanstack`, 34-case conformance, zod-4 default | **done** (2026-07-11) |
| W2-b | modules | `foundation/config` typed env — `defineConfig(schema)` over ordered sources (runtime `window.__APP_CONFIG__` ahead of build-time `import.meta.env`) · 8 field builders (`str`/`num`/`bool`/`oneOf`/`url`/`port`/`json`/`list`) · optional/default/required + prefix · **fail-fast** aggregated `ConfigError` · secret redaction; new `foundation/config` subpath (4-point wiring + playground alias backfill for resilience/identifiers/i18n), 18 unit tests | **done** (2026-07-13) |
| W2-c | modules | storage v2 — `namespacedBroker` (key-prefix isolation, composes/nests) + `createVersionedStore` (`{v,data}` envelope · on-read migration chain `n→n+1` w/ write-back upgrade · legacy-bare→v0 · newer-version & chain-gap & throw all degrade to `initial`) + `useAutosave` hook (debounced save · `idle/pending/saving/saved/error` status · `flush`/`cancel` · stale-run guard · **unmount-flush** via `pendingRef`) + **`foundation/storage/zustand`** adapter (`brokerPersistStorage` → zustand `PersistStorage`; structural mirror, **zero zustand dep**; versioning stays with zustand's own `persist` opts); 29 tests | **done** (2026-07-13) |
| R-1 | review | **router + query maturity review** done — both [`router-review.md`](../architecture/analysis/router-review.md) + [`query-review.md`](../architecture/analysis/query-review.md): **migration-ready, 0 blockers each**; in-review fixes landed (cancellation retry/toast guard, RouteAnnouncer focus-steal, DocumentMeta staleness, PageViewTracker dupes, RoutePersistence open-redirect, +45 tests incl. zero-coverage `CreateAppRouter`/`CreateQueryClient`); fix batch LANDED (M1 deep-import isolation — rrd only in `dist/router/index.js` · M4 `<TRaw, TData = TRaw>` inference · M3 `meta.suppressGlobalError` + `onError` context · M5 `page` raw access); deferred+documented: `requireAuth` returnTo double-basename (basename apps only) · S-1 hygiene (house `QueryKey` alias, typed native escape hatch, router contract consolidation) | **done** (2026-07-11) — layers migration-ready |
| S-1 | sweep | **swappable-modules retrofit sweep** per workspace convention `conventions/development/swappable-modules.md`: audit ALL modules/components built pre-convention (`/query` RQ coupling, `/router` RR coupling, `/auth` strategies, `/feedback`, themes engine, icons/lucide, floating-ui/radix internals) → per-module verdict (already-conformant / contract-extraction needed / exempt+why) → retrofit iterations | todo (audit first) |
| F-2 | forms | [`analysis/forms-vector-next.md`](../architecture/analysis/forms-vector-next.md) — **F-2a done** (chrome seam = `FormControlContext` registration; conformance 34→36) · **F-2b done** (all 4 families: 30 controls wired + per-item provider isolation in groups/panels vs duplicate-id class, markdownEditor id-clobber fixed, +90 regression tests) · **F-2c done** (real zod-4+valibot seam pinned on both engines, +42 incl. non-English verbatim; `'Unknown error'` fallback = last SDK-authored literal, contract fix queued) · **F-2d done** (5 canonical play() flows; 5 contract-friction items → F-2h backlog: array-row value typing, reset-after-reset(data) Discard footgun, no cross-field setValue) · **F-2e done** (5 recipes: wizard per-step gate · dirty-nav guard on real `createMemoryRouter` · optimistic submit w/ rollback · file-upload form · `focusFirstInvalid` helper; **also fixed the cold-cache flake at source** via `.storybook` `optimizeDeps.include`) · **F-2f done** (drydock `RegisterProduct`/`RegisterServer` + secrets-vault `Login`/`SetSecret` on published `0.0.95`; hand-rolled glue deleted; `forms.md` softened: direct-submit allowed + must-throw-SDK-`ApiError` + re-trim rules added; 9-item contract backlog seeded in forms-vector-next.md §F-2h) · **F-2g done** (smart-qr `CreateCodeScreen`: 18 `useState`→5, 13-setter prefill→one `reset(data)`, discriminated content-union binds cast-free, array rules through chrome; strains → §F-2h) · **F-2h done** (2026-07-11: 6 contract improvements shipped both engines, conformance 72→94; `targets.md` §2.7 synced to DONE; `forms.md` convention captures all new members; escape-hatch audit = **0 `.engine` reach-ins** across all 3 migrated products) | **VECTOR COMPLETE** (2026-07-11) — 1789 tests. Deferred-architectural analysis → [`analysis/forms-deferred-items.md`](../architecture/analysis/forms-deferred-items.md): **item 2b SHIPPED (2026-07-11)** — `useFieldArray<TItem>` typed row helper (engine-free, both adapters), conformance 86→94, `ArrayRows` recipe de-cast, `forms.md` §Arrays mandates it; **items 1 (per-leaf union errors) + 3 (`fieldErrors` recognizer) stay deferred**. Template `src/form.ts` stamp deferred (per owner); autosave recipe waits W2-c · **F-2 completeness pass done** (2026-07-11): the 6 ship-now capabilities from [`analysis/forms-completeness.md`](../architecture/analysis/forms-completeness.md) shipped both adapters — `submitOn`+`submitDebounceMs` auto-submit · `submitInvalid` · concurrent-submit guard · `form.validate()` · `validateOnMount` · whole-form `isDisabled`; all additive (existing 94 conformance cases + call sites unchanged), routed through the one `submit()` path, conformance **94→114**; `forms.md` §Submit/§Validation-timing/§Field-wiring captured; completeness tally now **34 shipped · 0 ship-now · 5 defer · 12 skip** |
| W3-a | modules | **`foundation/shortcuts`** — keyboard-shortcut system: pure `Chord` model (`parseChord`/`matchesChord`/`formatChord`, platform-adaptive `mod`=⌘/Ctrl, `Modifier` + re-exported `Key` constants) + `useHotkeys`/`useHotkeyMap` binding hooks (window- or element-scoped, typing-context aware, ⌘/Ctrl-combos-in-inputs allowed). Replaces hand-rolled `cmd+K`/`Enter` listeners; 22 tests | **done** (2026-07-13) |
| W3-b | modules | remaining Wave 3: `foundation/files`+`foundation/format` · `analytics` event bus · `flags` (OpenFeature-shaped) | queued |
| W3-c | modules | **command registry / palette-integration** (the "commands" half): named-action registry (`id`/`title`/`run`/`shortcut`/`when`) that `useHotkeyMap` binds + `CommandPalette` searches; adopt `foundation/shortcuts` in `CommandPalette` (drop its inline `cmd+K`) + `ChatComposer` | queued (design-first) |
| A11y-2 | testing | contrast design-tuning tail (~60: `Surface`/`Button.matrix` soft combos) — needs owner's eye · dark-mode axe pass · flip `a11y.test`→`'error'` | blocked on design session |
| P6 | components | targets.md refactor vectors: density · i18n · z-index tokens · motion tokens · virtualization (`react-virtual` internal) · Table batch-6 features | queued |

---

## Backlog — trigger-gated / unscheduled

> Forward-looking items surfaced from the analyses (iter 7 consolidation) — **not** in the active/queued table above; each fires on its own trigger. Deep detail stays in the linked analysis.

| Item | Trigger | Source |
|---|---|---|
| `foundation/errors` extraction | when the `foundation/http` error path is next touched (promote-on-touch) | [`frontend-modules.md`](../architecture/analysis/frontend-modules.md) E#6 |
| `AppDevtools` panel | a consumer wants an in-app dev panel | `frontend-modules.md` E#10 |
| `uploadQueue` module | a product needs queued / resumable uploads | `frontend-modules.md` E#9 |
| Forms — union per-leaf error ergonomics | a **2nd** product wants inline union-field errors → ship a `forms.md` userland pattern first, a thin `variantField` doc-helper only then (never the `subForm`) | [`forms-deferred-items.md`](../architecture/analysis/forms-deferred-items.md) item 1 |
| Forms — `fieldErrors` duck-type default | opportunistic — only if `foundation/http/FieldErrors.ts` is opened for another reason (else stays a convention line) | `forms-deferred-items.md` item 3a |
| Forms — 5 deferred completeness capabilities | each per its named trigger (async-field-validation @ 2nd product, warnings channel, …) | [`forms-completeness.md`](../architecture/analysis/forms-completeness.md) |
| global-state swappable module | scheduled → **v0.1 iter 8** (design-first) | [`vector-registry.md`](../architecture/vector-registry.md) §Infra-pipeline |
| Docs — content-audit (v0.1 2b) | delete stale `enum-alignment` record (first verify its 16-enum registry is in `conventions/…/enums.md`) + split analyses → conventions | [`v0.1.md`](./version-track/v0.1.md) iter 2 |
| Docs — catalog convention | codify the derived-`component-catalog` pattern in `sdk-structure.md` (the instance stays local/auto-gen) | `v0.1.md` iter 3 |

---

## SDK organize (2026-07-11)

The O-1…O-6 restructure/docs/vectors iterations now live in the version track → [`version-track/v0.1.md`](./version-track/v0.1.md). (This registry moved from `docs/planning.md` into `engineering/planning/` in iter 1, 2026-07-13.)

---

## Standing rules

- new iteration → add a row here FIRST; deep analysis goes to `analysis/*.md` and is linked, never inlined
- finished iteration → flip Status with date; move learnings to the linked analysis doc, not this table
- engine-wrapping work → follows `conventions/development/swappable-modules.md` (workspace convention)
