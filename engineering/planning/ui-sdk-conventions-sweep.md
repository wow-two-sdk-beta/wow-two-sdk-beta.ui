# UI SDK — conventions sweep

*Last updated: 2026-08-23*

> The running list of code that does not yet meet the frontend conventions, with counts measured against the tree.
> Purpose — the conventions landed as 108 docs in one pass; the code has not caught up, and that gap needs one home.
> Use case — pick the next item, sweep it, tick it. Add a row whenever a convention lands that the code breaches.

Rules live at `wow-two-ws/conventions/development/frontend/`. Every count was measured, not estimated.
Re-measure before starting an item — other lanes move the numbers.

## Open

| # | Item | Size | Gate that catches it |
|---|---|---|---|
| 1 | Comment length and compaction | 279 `max-len` left of 327 — `foundation` 144 · `presentation` 64 · `auth` 26 · `query` 26 · `router` 19 | `pnpm lint` (`max-len`) |
| 2 | Port-provenance narration — "React did X, so we do Y" | ~1,484 comment lines | review only |
| 3 | `'aria-*'` literals bypassing `AriaAttribute` | 125 sites · 46 files | review only |
| 4 | `SCREAMING_SNAKE` constants against the PascalCase rule | 344 sites · 218 files | review only |
| 5 | Bracket arrays `T[]` where `ReadonlyArray<T>` is required | 342 SDK · 30 app | review only |
| 6 | Bare string-literal unions where a `const` object is required | 15, all in `foundation/` | review only |
| 7 | Components sitting in a group whose gate they fail | 2 of the 7 in `display/` survive re-verdict — `tooltip` → `overlays`, `emptyState` → `state`; `characterCount`, `passwordStrength`, `ColorSwatch` in `forms/` are untested | review only |
| 8 | `.spec.md` coverage | 198 of 378 components carry none | review only |
| 9 | pre-19 React spellings — `forwardRef` banned by `react/react.md` | 324 `forwardRef` sites · 233 files · 164 `ComponentPropsWithoutRef` · 46 `<Context.Provider>` across 41 files | review only |
| 10 | `SpeedDialTrigger.vue:68` uses the v3 `!px-0` important spelling | 5 classes | none — silently emits nothing |
| 11 | `*Screen` retired in favour of `*Page` | 4 components, smart-qr | typecheck after rename |
| 12 | `Result<TSuccess, TFailure>` carrier absent | 17 unions to fold in | typecheck |
| 13 | 7 `*Result` types are return bags, not carriers | rename to `*Controls` | typecheck |
| 14 | API failures throw rather than return a `Result` | `http` and every caller | typecheck |
| 15 | Props-interface members not marked `readonly` | 1,537 members · 308 SFCs | review only |
| 16 | Component doc not anchored `/** Renders … */` | 390 of 406 SFCs | review only |
| 17 | `defineExpose({ el })` exposing only the root node | 308 sites | review only |
| 18 | No demo surface per component | 0 stories · 121 SFCs unreferenced by the playground | review only |
| 19 | Emit members not documented `Fires when …` | 198 of 237 members | review only |
| 20 | `<slot>` rendered with no `defineSlots` declaration | 80 SFCs · 118 names | review only |
| 21 | `v-for` keyed on the loop index | 29 sites | review only |
| 22 | Non-camelCase folders | 27 dirs — 26 PascalCase under `foundation/utils/` | review only |
| 23 | A prop crossing a boundary as a plain value, not a getter | 3 sites | review only |
| 24 | `*Helpers.ts` files, banned in favour of `*Extensions` | 4 files | review only |
| 25 | Components carrying no kind suffix | 112 SFCs of 406 — 175 suffixed · 102 subparts · 13 primitives · 3 modifiers (re-measured 2026-08-23 against the shape-word table) | typecheck after rename |
| 26 | Capability folders named for an activity, banned by `architecture.md:42` | 7 — `validation` `format` `sync` `selection` `share` `undo` `utils` | review only |
| 27 | `.spec.md` files still React-era, several contradicting the code | 68 of 181 name React · 8 call `Modal` a `Dialog` · `Frame` radius set · `AppShell` and `ResizablePanels` compound statics · `ScrollArea` cites a component that never shipped | review only |

### 25 — every component takes its kind suffix

The bare-name carve-out is retired: `Fab` does not say whether it is a control, an overlay or a page, and a
reader pays that ambiguity on every file. `components.md` § *Naming* now requires the suffix on every component.
A `Root{Part}` compound subpart is exempt — its root already carries the kind. An enum is exempt too; its own
name carries the role (`*Type` · `*Status` · `*Level`).

Target names come from the kind doc that owns each group, not from a central table. The rename is public API,
so it lands in one pass with the four gates green, not piecemeal.

---

### 23 — a prop crossing a boundary as a plain value

`vue/no-setup-props-reactivity-loss` flagged 45 sites; 42 are the read-once seed of an uncontrolled component
and are correct. The rule is `off` in `eslint.config.js` for that ratio — `macros.md` § *Reading a prop* carries
the rule instead. Three sites hand a live prop across a boundary as a plain value, beside a `computed` doing it
properly in the same object: `MenubarMenu.vue:25` · `NavigationMenuItem.vue:26` · `ProgressProvider.vue:37`.
Consistency, not a proven defect — `ResizablePanel.vue:34` shows the compensating `watch` pattern.

| Pattern | Sites | Verdict |
|---|---|---|
| `ref(props.default*)` · `ref(props.initial*)` seed | 23 | correct |
| `useControlled({ default: props.x })` | 16 | correct — all 26 `controlled:` options pass a getter |
| single-instance `provide` · a read a `watch` re-syncs | 3 | correct |
| a live prop handed across a boundary as a plain value | 3 | **the row** |

---

### 15-22 — the Vue macro and doc-anchor gap

Every `defineExpose` / `defineSlots` / `defineProps`-shape rule was unrepresented in rows 1-14. Row 15 is the
sibling half of the same `components.md:56` bullet whose array half is row 5 — sweep the two together.

Smaller measured breaches, not ranked in: 18 lowercase `use*.ts` hook files · 5 banned `*Helpers.ts` names plus
`QueryTestUtils.ts` and the `foundation/utils/` folder · 8 `.vue` files flattened beside sibling folders, six of
them `presentation/overlays/Overlay*.vue` · 15 plain `<script>` blocks exporting nothing · 5 inline
`defineProps<{…}>` · 131 undocumented props members · 68 raw palette classes, all in `Avatar.vue`.

Checked and clean: `index.ts` barrels · `export default` (1) · `defineOptions` · block order · `@src/` alias ·
string `provide()` keys · emit-name casing.

---

## Rule conflicts

The conventions themselves carry no open contradictions — all 25 were closed or refuted on 2026-08-24,
so every row below gates against a settled rule.

---

### 12-14 — the result pattern

`result.md` is written; the code has none of it. Order matters — carrier first, renames second, API last.

| Step | What |
|---|---|
| 12 | add `foundation/results/` — `Result`, `Failure`, `ResultExtensions` |
| 13 | rename the 7 bags: `UseWorkerResult` → `UseWorkerControls`, and its siblings |
| 14 | fold each module's union into a `{Noun}Failure`, then return `Result` from `http` |

---

### 7 — the display group

`presentation/display/` claims a gate its own members fail. Each moves to the group whose gate it passes:

Re-verdicted 2026-08-23 against `control.md:72` — a control declares `modelValue`. None of the five does,
so emitting a change is not on its own enough to move a component into `control`.

| Component | Measured | Verdict |
|---|---|---|
| `carousel` | emits `index-change`, no `modelValue` | stays a display — the `control` move is refuted |
| `sortable` | emits `reorder`, no `modelValue` | stays a display — the `control` move is refuted |
| `tabs` · `accordion` | emit `value-change`, no `modelValue` | `control` only once they declare one |
| `collapsible` | two-way on `open`, not on a value | stays a display — open state is not a form value |
| `tooltip` | floats out of flow | `overlays` — unchanged |
| `emptyState` | stands in for absent content | `feedback`, as `state` — unchanged |

`card` was checked and **passes** — chrome plus children, no state, no value, so it stays a display.

---

## Done

| Item | Result |
|---|---|
| `.standard.md` files removed, specs de-referenced | 4 deleted, 4 specs cleaned, 0 dangling |
| `Overlay*` prefix retired in favour of the suffix | written into `suffixes.md` |
| Google sign-in extracted to `foundation/oauth` + `presentation/actions` | 6 dom tests, 4 gates green |
| `og:` meta tags and route-derived meta | `installDocumentMeta`, 5 dom tests |
| Prettier at `printWidth: 120` + ESLint `max-len` | 541-file format pass, both gates wired |
| `presentation/actions` comment sweep | 24 `max-len` warnings → 0 |
| All-caps acronyms renamed — `JsonEditor*` · `Fab*` · `PdfViewer*` | 12 files, 155 sites, 4 gates green; `git mv` pending |
| Shared DOM constants — `AriaAttribute` · `AttributeValue` · `DomEvent` | `foundation/utils`, `CopyButton` is the example |

---

## Method and gates

Two agents died mid-run on a whole-package sweep; going area by area by hand has not failed once.

- must run the convention gate per area first — delete port-provenance, restated rules and usage examples.
- must compact second, and wrap only third. Wrapping first re-flows text the gate would have deleted.
- five areas cleared 48 `max-len` warnings that way.

Four gates, all green after every area, plus `eslint` at 0 errors:

| Gate | Command | Note |
|---|---|---|
| types + SFC | `pnpm typecheck` | runs `vue-tsc` and `check-sfc` over 406 SFCs |
| format | `pnpm format:check` | Prettier at `printWidth: 120` |
| tests | `pnpm test` | 1,340 |
| lint | `pnpm lint` | 0 errors; `max-len` warnings are row 1 |

`check-sfc` is the one with no substitute — moving `/* @vue-ignore */` above a multi-entry `extends` breaks it
while every other gate passes.

---

## Neighbours

- [conventions](../../../../../conventions/development/frontend/frontend-conventions.md) — the rules this sweep enforces
- [vue port track](vue-port-track.md) — the port that produced most of the debt
