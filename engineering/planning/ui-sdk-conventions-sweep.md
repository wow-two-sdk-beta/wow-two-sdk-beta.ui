# UI SDK — conventions sweep

*Last updated: 2026-09-13*

> The running list of code that does not yet meet the frontend conventions, with counts measured against the tree.
> Purpose — the conventions landed as 108 docs in one pass; the code has not caught up, and that gap needs one home.
> Use case — pick the next item, sweep it, tick it. Add a row whenever a convention lands that the code breaches.

Rules live at `wow-two-ws/conventions/development/frontend/`. Every count was measured, not estimated.
Re-measure before starting an item — other lanes move the numbers.

## 2026-09-09 — conventions audit gate

The full 363-document convention review is recorded in the workspace
[analysis](../../../../../system/sessions/frontend-conventions-sweep/analysis.md), with file-level evidence and
15 convention work groups. Finish those convention amendments before treating the SDK's rename and behavior
rules as settled. The separate [SDK baseline](../../../../../system/sessions/frontend-conventions-sweep/sdk-baseline.md)
remeasures selected rows and records release gaps; it is not a full source audit.

The owner permits radical breaking changes and confirms no production consumers. Active scope, confirmed
2026-09-10: Vue `@wow-two-beta/ui-vue`; React implementation/release is parked. Row 11 belongs to the smart-qr app;
it does not silently authorize app edits in this SDK lane. Retain completed rows and their history.

Rows 31–42 came from the convention analysis; row 43 records the final whole-layout audit's additional work.
Row 44 records the owner-selected lossless JSON/exact-number prototype.
Their size is unmeasured unless the baseline or current resolution report says otherwise.
Existing counts remain historical until remeasured for the selected package. In particular, row 23's three
live-prop cases still need an explicit disposition even though the row is absent from the Open table.

Rows 12–14 also need broader acceptance: distinguish operation results from live hook state, preserve the
Standard Schema protocol, adapt query rejection semantics, handle empty HTTP responses and cancellation,
and validate backend error fixtures. Rows 7/25 wait for taxonomy and composition rules; row 17 waits for
the qualified root-handle contract and a consumer-usage inventory.

## Open

### Vue progress — 2026-09-13

The tables below retain the original queue and historical measurements. The Vue implementation sweep is
complete and committed in `3ae7df7` plus its preparatory commits. Final combined gates and hosted publication
pass. React/app rows and broad exact-number adoption remain outside this sweep.

| Rows | Current Vue disposition |
|---|---|
| 31 | Package-aware instructions and Vue-only ownership applied; React/app rows parked |
| 30, 23 | ARIA vocabulary and all three live-prop boundaries fixed; regression tests pass |
| 32, 42 | Manifest-driven entries, strict packed consumers and verified `0.0.6` release implemented |
| 7, 25 | 109 component families renamed/reclassified; current types/SFC/playground build pass |
| 12–14, 36, 40 | Shared Result, schema-preserving HTTP/query/auth boundaries and auth races fixed |
| 38 | Both adapters preserve parsed output, submit snapshots and trailing autosave; shared regressions pass |
| 39 | Deterministic locale hydration and independent provider roots verified |
| 34, 37 | Motion/keyboard/drag and theme corrections implemented; Chromium ordinary/forced-colors checks pass |
| 22, 26, 43 | Utility/hooks buckets retired; capability roles, carrier files, adapters, source casing and visual roots corrected |
| 8, 18, 27 | 379 adjacent specs; 349 public SFC demo fixtures; stale Vue contracts corrected |
| 35 | 95 canonical model surfaces; 54 native-reset roots; IME/draft/reset regression coverage passes |
| 17, 33, 41 | Qualified DOM root handles, provider/lifecycle/modal corrections and export/runtime matrix complete; browser checks pass |
| 9, 11 | React and smart-qr work parked outside the Vue sweep |
| 44 | ExactNumber/LosslessJson prototype, HTTP codec and form-value preservation pass unit/integration/package gates; broad client/control adoption remains outside the prototype |

Resolution evidence is in workspace `system/sessions/frontend-conventions-sweep/`:
`vue-results-resolution.md`, `vue-behavior-audit.md`, `vue-components-resolution.md` and the three convention
resolution reports. Browser operation Result migration and resource cleanup are implemented.
Final current-source gates pass: 93 Node/DOM/SSR test files / 1,639 tests, 30 Chromium tests, 407 SFCs,
types, lint, formatting, capability graph, library/playground builds and an independent fresh npm consumer.
The [final verification report](../../../../../system/sessions/frontend-conventions-sweep/vue-final-verification.md)
links current evidence for the real-browser, isolated fresh-install and registry checks.
All verification gates pass. Run `34998940096`, attempt 2, published `@wow-two-beta/ui-vue@0.0.6` with npm
trusted-publisher provenance and created matching tag and GitHub release `ui-vue-v0.0.6` on 2026-09-19.

### Original row inventory

| # | Item | Size | Gate that catches it |
|---|---|---|---|
| 30 | 9 `aria-*` names have no `AriaAttribute` member | `aria-live` `aria-orientation` `aria-invalid` `aria-pressed` `aria-haspopup` `aria-roledescription` `aria-valuemin` `aria-valuemax` `aria-valuenow` — template-only today | review only |
| 7 | Components sitting in a group whose gate they fail | 2 of the 7 in `display/` survive re-verdict — `tooltip` → `overlays`, `emptyState` → `state`; `characterCount`, `passwordStrength`, `ColorSwatch` in `forms/` are untested | review only |
| 8 | `.spec.md` coverage | 198 of 378 components carry none | review only |
| 9 | pre-19 React spellings — `forwardRef` banned by `react/react.md` | 324 `forwardRef` sites · 233 files · 164 `ComponentPropsWithoutRef` · 46 `<Context.Provider>` across 41 files | review only |
| 11 | `*Screen` retired in favour of `*Page` | 4 components, smart-qr | typecheck after rename |
| 12 | `Result<TSuccess, TFailure>` carrier absent | 17 unions to fold in | typecheck |
| 13 | 7 `*Result` types are return bags, not carriers | rename to `*Controls` | typecheck |
| 14 | API failures throw rather than return a `Result` | `http` and every caller | typecheck |
| 17 | `defineExpose({ el })` exposing only the root node | 308 sites | review only |
| 18 | No demo surface per component | 0 stories · 121 SFCs unreferenced by the playground | review only |
| 22 | Non-camelCase folders | 27 dirs — 26 PascalCase under `foundation/utils/` | review only |
| 25 | Components carrying no kind suffix | 112 SFCs of 406 — 175 suffixed · 102 subparts · 13 primitives · 3 modifiers (re-measured 2026-08-23 against the shape-word table) | typecheck after rename |
| 26 | Capability folders named for an activity | 1 left — `utils` names no capability and holds 31 sub-folders across 4 roles; `selection` and `share` are nouns and pass | review only |
| 27 | `.spec.md` files still React-era, several contradicting the code | 68 of 181 name React · 8 call `Modal` a `Dialog` · `Frame` radius set · `AppShell` and `ResizablePanels` compound statics · `ScrollArea` cites a component that never shipped | review only |
| 31 | Refresh package-aware instructions and sweep ownership | React-era repo instructions contradict spec/helper/story rules; restore row 23 to explicit tracking; convention tasks C01/C15 | Instruction-to-tree review and per-package row inventory |
| 32 | Reconcile moved sources with every public export | Vue `format`, `sync`, `undo`, `validation` entries reference retired folders; entry filtering can omit advertised exports; C01/C13 | Fail on missing declared entries; packed runtime/type/style export checks |
| 33 | Correct modal, navigation and provider behavior | Determine affected components after C04; include nonmodal focus, ordinary link tab order and capability-scoped hosts | Browser keyboard/focus checks and provider lifecycle tests |
| 34 | Complete accessibility behavior | C05: forced-colors focus, editor keyboard exit, persistent motion controls, drag alternatives, announcements and label relations | Targeted DOM/browser tests plus manual keyboard and assistive-technology checks |
| 35 | Apply controlled/composite/native input contracts | C03: mode, seed, reset, clear, draft values, composition events, caret, fused/group field naming | Input interaction tests for supported modes and composite controls |
| 36 | Verify wire codecs and runtime schemas | C06/C10: precision, date/time/duration, Map/dictionary, omission/null/clear and external enum values | Backend-compatible round-trip fixtures and malformed-input tests |
| 37 | Apply CSS, class-merging and theme delivery rules | C09: important/arbitrary/custom utilities, focus styles, responsive grids, motion and delivered theme assets | Generated-CSS/class-merging tests and representative rendered checks |
| 38 | Complete form parsing and async behavior | C07: raw versus parsed values, wizard steps, autosave trailing edits, cancellation and stale responses | Form adapter tests with transformations and out-of-order completions |
| 39 | Apply locale/time and capability lifecycles | C11: locale changes, caller text, RTL, date-only/timezone semantics and resource cleanup | Locale/date fixtures and repeated mount/unmount tests |
| 40 | Define and apply frontend trust boundaries | C14: public config, auth redirects/logout, storage, upload authority and sensitive diagnostics; missing policy is not proof of a vulnerability | Targeted boundary tests and owner-linked review |
| 41 | Verify import, ref and runtime support contracts | C08/C12: DOM-free imports versus SSR scope, request isolation, cleanup and representative ref consumers; extends rows 9/17 | Isolated import checks, lifecycle tests and browser/runtime matrix |
| 42 | Close behavior/demo coverage and release gates | C12/C13: remeasure rows 8/18/27, verify test discovery, run all selected-package gates and consume its actual tarball | Typecheck, lint, format, tests, build, pack, isolated consumer; verify registry/tag/release |
| 43 | Complete remaining source roles and capability ownership | Final whole-layout pass: generic hooks bucket, multi-file role groups, provider/model/enum groups, source adapters, visual foundation roots, theme file casing and Result carrier files | Semantic role inventory; no stale imports; source/SFC compilation; capability-cycle gate; packed exports |
| 44 | Lossless numeric values and JSON codecs | Owner-selected 2026-09-12: restricted representations last; exact numeric type, explicit arithmetic, lossless parse/write and HTTP codec integration | Unit arithmetic oracles, .NET numeric fixtures, HTTP round trips, strict types and packed consumer |

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

The 2026-08-24 pass closed or refuted its 25 recorded conflicts. The full review's C01–C15 rule amendments
are now resolved with source/compiler/CSS/browser evidence in the workspace resolution reports.
Endpoint-specific exact decimal/int64 representations still require backend agreement; they are not a
global SDK coercion policy. Current SDK implementation rows gate against these amended rules.

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
| Comment length and compaction, all five areas | 279 `max-len` → 3, four gates green, 137 files |
| React port-provenance narration removed | 52 files, 7 comments deleted, 156 clauses cut, 0 real hits left |
| `aria-*` literals routed through `AriaAttribute` | 66 sites, 35 files, 35 imports, four gates green |
| Module-private constants renamed to PascalCase | 344 renamed, 438 refs, 238 files, four gates green |
| Array types moved to `ReadonlyArray<T>` | 280 converted, 103 files; 127 mutable sites kept by design |
| Props members marked `readonly` | 1,667 added; 33 context / mutable-state members kept |
| Every SFC opens `/** Renders … */` | 388 docs written or rewritten, 406 of 406 compliant |
| Emit members documented `Fires when …` | 210 written |
| `<slot>` declared through `defineSlots` | 117 declared, 0 undeclared left |
| `v-for` keyed on identity | 21 replaced; 15 primitive lists keep an index key |
| String-literal unions became `const` objects | 13 converted to the `AriaAttribute` pattern |
| `*Helpers.ts` renamed `*Extensions` | 4 files, every importer moved |
| Exported constants renamed to PascalCase | 43 renamed across every importer, tests included |
| `aria-*` names in type position | 7 routed through `typeof AriaAttribute.*` |
| v3 `!` important spelling and 3 long class strings | eslint reaches **0 errors, 0 warnings** |
| 4 activity folders renamed to model nouns | `validation`→`validators` · `format`→`formatters` · `sync`→`channels` · `undo`→`history`, four gates green |
| Frontend folder sets written, mapped to the backend projects | `architecture.md` per layer, `library.md` per capability module |
| `selection` role-grouped | `models/` + `hooks/`, the first capability to obey the new set |

---

## Method and gates

A whole-package sweep in one pass fails; a fan-out of agents over **disjoint file sets** does not.
Six rows cleared this way on 2026-08-24, each ending with all four gates green.

- must run the convention gate per area first — delete port-provenance, restated rules and usage examples.
- must compact second, and wrap only third. Wrapping first re-flows text the gate would have deleted.
- must fence each agent to its own files or directory — two agents editing one file lose writes.
- must run all four gates once per row, after the fan-out, never per agent.
- must re-measure with the row's own grep afterwards; an agent's self-report is not the verdict.

### Two measurement traps

- `awk 'length>120'` counts **bytes** on macOS while eslint counts characters. These files carry
  `—` · `·` · `→`, so awk over-reports every long-line count. Measure with python3 `len()`.
- BSD `sed` ignores `\b`: `sed -i '' 's/\bFOO\b/Bar/g'` matches nothing and exits 0. Use
  `perl -pi -e`, and re-grep the old name rather than trusting the exit code.

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
