# Planning — iterations & tasks

*Last updated: 2026-07-11*

> The single iteration/task registry for this repo — every vector's status lives HERE; the `docs/analysis/*.md` files are deep-analysis reference,
> `docs/testing.md` keeps its own detailed iteration table (linked). One row per iteration: compact, current, no history prose (git has history).

## Vectors

| Vector | Deep reference | Status |
|---|---|---|
| Components (P3 build-out) | `analysis/ui-philosophy/targets.md` + roadmap | organisms done; P6 refactor vectors NEXT |
| Testing layer | [`testing.md`](./testing.md) (own iteration table, It1–10 done) | live — 1550 tests; a11y contrast tail deferred |
| Infra modules (waves) | [`analysis/frontend-modules.md`](./analysis/frontend-modules.md) | Wave 1 done · Wave 2 in progress |
| Forms / fields / validation | [`analysis/forms-engine.md`](./analysis/forms-engine.md) | engine shipped (2 adapters); maturation next |
| Lib adoption | [`analysis/lib-adoption.md`](./analysis/lib-adoption.md) | verdicts set; consumed per-wave |
| Theming | `THEMES.md` | engine + 183 themes; smart-qr AA exception pinned |

---

## Iterations — active / queued

| It | Vector | Tasks (one-liner) | Status |
|---|---|---|---|
| W2-a | modules | `/forms-engine`: contract + `house` + `tanstack`, 34-case conformance, zod-4 default | **done** (2026-07-11) |
| W2-b | modules | `foundation/config` typed env (`defineConfig(schema)` over `import.meta.env` + `window.__APP_CONFIG__`) | todo |
| W2-c | modules | storage v2 — versioned keys · migrations · zustand-persist adapter · autosave | todo |
| R-1 | review | **router + query maturity review** done — both [`router-review.md`](./analysis/router-review.md) + [`query-review.md`](./analysis/query-review.md): **migration-ready, 0 blockers each**; in-review fixes landed (cancellation retry/toast guard, RouteAnnouncer focus-steal, DocumentMeta staleness, PageViewTracker dupes, RoutePersistence open-redirect, +45 tests incl. zero-coverage `CreateAppRouter`/`CreateQueryClient`); fix batch LANDED (M1 deep-import isolation — rrd only in `dist/router/index.js` · M4 `<TRaw, TData = TRaw>` inference · M3 `meta.suppressGlobalError` + `onError` context · M5 `page` raw access); deferred+documented: `requireAuth` returnTo double-basename (basename apps only) · S-1 hygiene (house `QueryKey` alias, typed native escape hatch, router contract consolidation) | **done** (2026-07-11) — layers migration-ready |
| S-1 | sweep | **swappable-modules retrofit sweep** per workspace convention `conventions/development/swappable-modules.md`: audit ALL modules/components built pre-convention (`/query` RQ coupling, `/router` RR coupling, `/auth` strategies, `/feedback`, themes engine, icons/lucide, floating-ui/radix internals) → per-module verdict (already-conformant / contract-extraction needed / exempt+why) → retrofit iterations | todo (audit first) |
| F-2 | forms | [`analysis/forms-vector-next.md`](./analysis/forms-vector-next.md) — **F-2a done** (chrome seam = `FormControlContext` registration; conformance 34→36) · **F-2b done** (all 4 families: 30 controls wired + per-item provider isolation in groups/panels vs duplicate-id class, markdownEditor id-clobber fixed, +90 regression tests) · **F-2c done** (real zod-4+valibot seam pinned on both engines, +42 incl. non-English verbatim; `'Unknown error'` fallback = last SDK-authored literal, contract fix queued) · **F-2d done** (5 canonical play() flows; 5 contract-friction items → F-2h backlog: array-row value typing, reset-after-reset(data) Discard footgun, no cross-field setValue) → **F-2e recipes → F-2f/g product proofs → F-2h closure** | F-2a–d done (2026-07-11); e next |
| W3 | modules | commands/shortcuts · files+format · analytics · flags (per wave plan) | queued |
| A11y-2 | testing | contrast design-tuning tail (~60: `Surface`/`Button.matrix` soft combos) — needs owner's eye · dark-mode axe pass · flip `a11y.test`→`'error'` | blocked on design session |
| P6 | components | targets.md refactor vectors: density · i18n · z-index tokens · motion tokens · virtualization (`react-virtual` internal) · Table batch-6 features | queued |

---

## Standing rules

- new iteration → add a row here FIRST; deep analysis goes to `analysis/*.md` and is linked, never inlined
- finished iteration → flip Status with date; move learnings to the linked analysis doc, not this table
- engine-wrapping work → follows `conventions/development/swappable-modules.md` (workspace convention)
