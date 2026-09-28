# Vue port — track

*Last updated: 2026-09-26*

> Track doc for `@wow-two-beta/ui-vue` — the Vue 3 port of `@wow-two-beta/ui`, living beside it at
> `engineering/codebase/wow-two-front-vue-beta-sdk`. **This file is the queue.**
>
> Why: the developer works faster in Vue, and the SDK's own measurements say the React ecosystem is no longer
> the reason to stay. Analysis: [`ideas/frontend-sdk-vue-port-analysis.md`](../../../../../ideas/frontend-sdk-vue-port-analysis.md)
> in `wow-two-ws`. The first product gate is ForeverPin rebuilt on this package.

---

## Status

`@wow-two-beta/ui-vue@0.0.6` is published. GitHub Actions run `34998940096`, attempt 2, passed and created
matching tag and release `ui-vue-v0.0.6` on 2026-09-19.

| Gate | Result |
|---|---|
| SFC compilation | 407 SFCs pass |
| Node/DOM/SSR | 1,774 tests pass |
| Chromium | 30 ordinary/forced-colors checks pass |
| Themes | 183 shipped themes pass declared contrast pairs |
| Packed consumer | Fresh install, runtime, types and styles pass |
| Registry | `@wow-two-beta/ui-vue@0.0.6` verified |

The published port and earlier conventions sweep are complete. The full Vue SDK implementation sweep
is verified locally: 2,025 unit/DOM/SSR tests, 57 Chromium/WebKit browser checks, 408 SFCs, library and
playground builds, seven-family gallery smoke and a clean packed npm consumer pass. Results and limits:
[full-sweep-implementation.md](../architecture/analysis/vue-sdk-optimization/full-sweep-implementation.md).
Firefox launch is blocked by the local macOS runtime; the expanded Linux CI matrix remains unverified.
The sweep shipped as `@wow-two-beta/ui-vue@0.0.7` (npm `latest`, verified 2026-09-26).
The [component inventory](../architecture/analysis/forever-pin-vue-readiness.md) remains the API map.
Remaining component gaps: [gap analysis](../architecture/analysis/vue-sdk-gap-analysis.md) → § *Gap-close queue*.

Playground, sandbox and theme-app optimization follow the ForeverPin migration.

---

## Locked decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Package `@wow-two-beta/ui-vue`, `0.x.y` beta-forever | mirrors the React package's release contract |
| D2 | Vue 3.5+, `<script setup>` SFCs — **not** TSX | the DX gain is the entire point of the port |
| D3 | Vite library mode + `@vitejs/plugin-vue` + `vite-plugin-dts` | `tsup` cannot compile SFCs |
| D4 | **Self-contained** — copies the agnostic layer, no shared `core` package | pilot speed; drift only bites in a both-live-forever world, which this port exists to avoid |
| D5 | Subpath export map mirrors the React package 1:1 | a consumer swaps the specifier, nothing else |
| D6 | Every public component needs a spec and playground fixture; risky behavior gets focused tests | smoke-only coverage proved insufficient during the conventions sweep |
| D7 | `release-vue.yml` with a `paths:` filter, separate from `release.yml` | a React push must never publish the Vue package |
| D8 | `forms-engine`, `router`, `query`, `auth`, `flags` and `analytics` ship together | the owner requested the full React capability surface in Vue |

---

## Translation rules

Applied uniformly across every wave.

| React | Vue | Notes |
|---|---|---|
| `forwardRef` (233 files) | *deleted* | attribute fallthrough + `defineExpose` |
| `createContext` / `useContext` (43) | `provide` / `inject` + typed `InjectionKey` | same provider + `useX()` names |
| `asChild` / `Slot` (31) | `Primitive` + `cloneVNode` merge | `reka-ui` approach; preserve exact `mergeProps` semantics |
| `Children.*` traversal (15) | context registration | items `register()`/`unregister()`; parent keeps ordered list |
| `useSyncExternalStore` (18) | `shallowRef` + subscribe | cleanup in `onScopeDispose` |
| `useLayoutEffect` (11) | `onMounted` | flag any genuine timing difference |
| `useImperativeHandle` (10) | `defineExpose` | |
| `createPortal` (1) | `<Teleport>` | |
| `useEffect` + `JSON.stringify` dep keys | `watch(..., { deep: true })` | the stringify hack disappears |
| `useEffect` cleanup + `useRef` guard | `onCleanup` | covers re-run **and** scope teardown |

Dependency swaps: `lucide-react`→`lucide-vue-next` · `@floating-ui/react`→`@floating-ui/vue` ·
`@radix-ui/react-focus-scope`→`reka-ui` or hand-rolled · `@tanstack/react-form`→`@tanstack/vue-form`.
Unchanged: `clsx` · `tailwind-merge` · `tailwind-variants` · `marked` · `temporal-polyfill`.

---

## Waves

Source measurements: `src/` 79,673 LOC · 1,001 files · 237 components · 41 foundation modules.

| Wave | Scope | Size | Status |
|---|---|---:|---|
| W0 | Scaffold — package, Vite lib config, eslint boundaries, `release-vue.yml`, `index.css` | 13 files | ✅ `dc6e929` |
| W1a | Agnostic core — 19 foundation modules + `domain/{color,emoji}` | 174 files | ✅ `5ab0d6d` |
| W1b | `foundation/primitives` — 18 primitives, the headless layer | 41 files | ✅ `f70f645` |
| W1c | `foundation/hooks` — 17 composables + `UseHotkeys` + `Spinner` fixes | 37 files | ✅ `5510735` |
| W1d | Remaining **20** foundation modules (engine copies + `useX` re-wrap) | 157 files | ✅ `2ea9c55` |
| W2a | `presentation/layout` — 23 of 24 (`appShell` blocked on `overlays/drawer`) | 78 files | ✅ `1d9882c` |
| W2a | `presentation/actions` 14 | 59 files | ✅ `0b6396e` |
| W2b | `presentation/forms` — **79 of 79**, three lanes (`be5a442` · `482f6f6` · `978e3cf`) | 272 files | ✅ |
| W2c | `presentation/display` — 70 of 73, 115 SFCs | 259 files | ✅ `53f12f0` |
| W2d | `presentation/feedback` — 25 of 27 (2 blocked on `overlays` + root `feedback`) | 81 files | ✅ `b5eb30a` |
| W2e | `presentation/overlays` 9 — `v-model:open` on all 7 stateful roots | 48 files | ✅ `2f29752` |
| W2f | `presentation/nav` — 11 of 11, 34 SFCs | 67 files | ✅ `bd01267` |
| W2g | Gap-close — `src/feedback` bus, `appShell`, `loadingOverlay`, `feedbackToasts`, `focusScope` stack | 19 files | ✅ `a0c8b56` |

### House rules learned in W2 (apply to every later wave)

1. **`vue-tsc` green ≠ buildable.** `@vue/compiler-sfc` resolves `defineProps<T>()` with its own,
   narrower resolver. `scripts/check-sfc.mjs` runs the real `compileScript` over every SFC and is wired
   into `pnpm typecheck`. It caught a live build break on its first run.
2. **Variant-derived prop types break that resolver** — `VariantProps<typeof xVariants>` throws
   `Failed to resolve extends base type` at build time. Spell the union out and lock it with `AssertExact`.
   Pattern: `presentation/layout/stack/Stack.vue`.
3. **`defineOptions()` cannot reference a local const** — it is hoisted outside `setup()`.
4. **An optional `Boolean` prop with no default is cast to `false`** — any tri-state boolean whose
   `undefined` is meaningful needs an explicit `x: undefined` in `withDefaults`.
5. **`inheritAttrs: false` + `cn(attrs.class)`, never `inheritAttrs: true`** — fallthrough concatenates
   `class` without tailwind-merge, losing React's `cn(variants(), className)` consumer-wins precedence.
6. **`vue/no-reserved-component-names` is off for `src/presentation/**`** — ~20 of 237 components are
   named after HTML tags, and none is globally registered, so none can shadow one.

### Traps no static gate catches

Found by the `actions` lane running a throwaway SSR smoke suite. Each passes `vue-tsc`, `eslint`, AND
`check-sfc`, then renders wrong. **Rule 4 above is the narrow case of trap 1.**

7. **`VNodeChild`-typed props are Boolean-castable.** `VNodeChild` includes `boolean`, so Vue casts an
   absent node prop to `false`, not `undefined`. Every `x !== undefined` guard reads truthy and the
   component locks into the wrong branch — `Button` rendered hover-swap markup on every instance and
   never rendered its loading spinner. Needs explicit `default: undefined` per node-valued prop.
8. **A declared hyphenated prop is camelized.** Declaring `'aria-label'` delivers it as `props.ariaLabel`,
   so `props['aria-label']` is always `undefined`. Six `actions` components shipped with no accessible
   name. Keep `aria-*` as fallthrough attrs; relocate via `attrs['aria-label']` when an inner node needs it.
9. **Chained listeners arrive as arrays.** A wrapper binding `@click` over a forwarded `onClick` gives the
   inner component an array in `attrs.onClick`; invoking it throws. Normalise before calling.

10. **Every SFC needs BOTH a plain `<script lang="ts">` and a `<script setup lang="ts">` block.** A
    setup-only SFC fails lint with `'_class' is assigned a value but never used` — `vue-eslint-parser`
    loses `ignoreRestSiblings` without the separate block, and the house `const { class: _class,
    ...others } = attrs` idiom trips it. Exported interfaces and `as const` enums go in the plain block.
    An empty `export interface FooProps {}` trips `no-empty-object-type` — keep the name, inline-disable.

Attr-forwarding order that reproduces React exactly: `inheritAttrs: false` → own attrs → `v-bind="rest"`
→ own handlers last, each guarded by `if (event.defaultPrevented) return`. Consumer attrs win (React's
`{...rest}` was last); consumer handlers still run first.

**Callback presence is load-bearing.** Vue strips a declared emit's listener out of `useAttrs()`, so a
callback whose *presence* picks an element or a role (`AudioWaveform.onSeek` → `role="slider"` vs
`"img"`; `HeatmapCalendar.onCellClick` → `<button>` vs `<div>`) must stay a PROP, not become an emit.

11. **A `TPath extends string` type param is literal-widened when `vue-tsc` resolves a template tag.**
    `name="title"` infers as `string`, not `"title"`, so a path-derived payload type falls through to
    `unknown` and every slot payload silently loses its type. A plain `.ts` call site infers correctly,
    which is what makes the regression invisible without a template-level test. Constrain with a type
    that contains literals: `(keyof TValues & string) | (string & {})`.

**Nothing that is not shipped code goes anywhere inside the package** — not under `tests/`, and not under
`src/`. `tsconfig.typecheck.json` includes `tests/**`, so a scratch file there gates every lane; a scratch
file under `src/` also gets committed and published. Four lanes have done one or the other; one took the
package RED for ~10 minutes.

**Reactive granularity is not free.** Exposing state through raw getters wakes every reader on every
commit — the tanstack engine fired 7 effect runs for 2 writes. Back each state member and each field slice
with its own `computed` so a sibling field's edit leaves an unrelated control asleep.

12. **Vue drops an event stamped in the millisecond its listener attached.** The invoker compares the
    event's first-handler timestamp with its own attach time, so a DOM test that mounts a surface and
    dispatches into it within one millisecond loses the event intermittently. Wait for `Date.now()` to
    advance after mounting before dispatching — `MenuVector.dom.test.ts` `settle()`.

`/* @vue-ignore */` on `VariantProps`-derived heritage keeps the SFC compiler off `typeof someVariants`
entirely — a simpler alternative to rule 2's spelled-out union + `AssertExact`.
| W3 | `forms-engine` + `house` + `tanstack`(vue-form) | 2,529 LOC | ✅ |
| W3b | `analytics` + `flags` + `auth` — headless top-level modules | ~1,835 LOC | ✅ |
| W4 | Full verification + publish `0.0.6` + pipeline verify | — | ✅ `34998940096` |
| W5 | Full Vue SDK review, corrections, optimization and missing reusable capabilities | — | 🔄 |
| W6 | ForeverPin Vue migration and product validation | — | ⬜ |
| W7 | Playground, sandbox and theme-app optimization | — | ⬜ |

| W3c | `router` + `query` onto `vue-router` / `@tanstack/vue-query` | 46 files | ✅ `1026bd7` |
| W4b | Root barrel + `MIGRATION.md` + README | — | ✅ |

**D8 revised:** `router` and `query` were ported after all. The user's scope was "move everything we have
with React", and deferring two modules to v0.2 served a v0.1 boundary he never asked for.

`router` is the largest API delta in the port. React hung five behaviours off an `<AppRoot>` layout route;
`vue-router` has no root element and expresses "every navigation" as `afterEach`, so they became
`installDocumentTitle` / `installDocumentMeta` / `installRoutePersistence` / `installPageViewTracker`.
`createAppRouter` still takes the same options, so an app that only calls it sees no difference —
**`nth26`'s whole migration is `element:` → `component:` per route**, plus `app.use(router)` in place of
`<RouterProvider>`.

### Bugs the port surfaced

- `focusScope` nesting was **runaway recursion**, not a cosmetic ping-pong: `.focus()` dispatches
  `focusin` synchronously, so two live listeners re-entered until the stack blew. Replaced
  registration-order luck with a module-level scope stack — one listener, topmost scope owns it.
- Four SSR crashes of one shape: a browser global touched from an `immediate: true, flush: 'post'`
  watcher, which Vue runs on the server. `requestAnimationFrame` (`Presence`, `Tour`, `UndoBar`) and
  `HTMLElement` (`overlays`).
- `Tour.isOpen` was pinned controlled-and-closed by rule 4 and could never open. Fixing it unmasked two
  of the SSR crashes above, which that bug had been suppressing.

W2a was sequenced first inside W2 because it was ForeverPin's critical path.

---

## Lanes

Parallel agents edit one working tree on one branch. Disjoint file sets only — no worktrees.

| Lane | Owns | Never touches |
|---|---|---|
| scaffold | package root configs, `src/index.css`, `src/index.ts`, `release-vue.yml` | anything else under `src/` |
| agnostic-core | `src/domain/**` + its 19 `src/foundation/*` modules | `primitives`, `hooks`, `presentation`, root config |
| primitives | `src/foundation/primitives/**` | everything else |

Agents stage scoped batches and commit with effective repository permission.
The developer publishes; CI bumps `0.0.y`.

---

## Full SDK sweep queue

The complete inventory and evidence live in
[`forever-pin-vue-readiness.md`](../architecture/analysis/forever-pin-vue-readiness.md).
The 2026-09-25 [deeper audit](../architecture/analysis/vue-sdk-optimization/deeper-audit.md) supplies
reproductions and acceptance criteria. Earlier capability delivery does not close these deeper behavior gaps.
Manual component-by-component review is no longer the prerequisite; mechanical corrections can proceed.

| It | Scope | Status |
|---|---|---|
| FP-1 | Response modes, retry classification, token cancellation and success metadata delivered (A09, A10, A20) | ✅ Implemented; combined local gates pass |
| FP-2 | Exact decoding, diagnostic operands, cached Intl and exact currency/percent delivered (A08, A22, A24) | ✅ Implemented; combined local gates pass |
| FP-3 | Session-owned unauthorized handling and Google Identity ownership (A01, A03) | ✅ Implemented; combined local gates pass |
| FP-4 | Session query/bridge disposal and route DOM timing (A02, A18) | ✅ Implemented; combined local gates pass |
| FP-5 | Union views, current-snapshot validation and shared row identities delivered (A04, A05) | ✅ Implemented; combined local gates pass |
| FP-6 | Inactive actions, controlled alpha, datetime bounds/liveness, cancelled sorts, native forms, select lifecycle, time/color accessibility (A11–A17, A19) | ✅ Implemented; combined local gates pass |
| FP-7 | Modal, alert-modal and popover APIs | ✅ Implemented; combined local gates pass |
| FP-8 | Navbar/card fixes delivered; final style/interaction regression evidence joins combined verification | ✅ Implemented; combined local gates pass |
| FP-9 | Display, marketing, table and glyph APIs | ✅ Implemented; combined local gates pass |
| FP-12 | Validator own-property safety and independent mutable defaults (A06, A07) | ✅ Implemented; combined local gates pass |
| FP-13 | Single class-merge owner and minimal-consumer bundle budgets (A21) | ✅ Implemented; combined local gates pass |
| FP-14 | LocaleProvider adoption for component defaults, reactive locale and RTL verification (A23) | ✅ Implemented; combined local gates pass |
| FP-15 | Packed Vue templates, cross-vector scenarios, browser matrix (A25) | ✅ Packed/cross-vector/Chromium/WebKit pass; Firefox Linux CI result pending |
| FP-11 | Combined verification and human-published Vue candidate | ✅ Published as `0.0.7` (npm `latest`) |
| FP-10 | `smart-qr` visual validation during the subsequent ForeverPin migration | ⬜ |

Implementation grouping: session ownership → forms/validators → Google Identity → HTTP → interaction safety
→ navigation/accessibility → measured efficiency → locale/exact display → combined release verification.
Independent groups may run in parallel; shared session contracts settle before dependent implementation.


### Full-source coverage

The owner expanded this pass from the ForeverPin subset to the entire Vue SDK.
All public modules, presentation families, shared primitives, exports and release gates are in scope.
React remains parked. Broad demo-app optimization follows the ForeverPin migration; API-compilation fixtures
and new-capability examples are part of this SDK pass.

| Lane | Scope | Current evidence |
|---|---|---|
| Pure foundations | Exact numbers, JSON, validators, i18n, config, collections, flags, utilities, domain and analytics | Implemented; detailed coverage and combined results in full-sweep report |
| Runtime foundations | Auth, HTTP, query, router, OAuth, browser capabilities and resource lifetimes | Implemented; detailed coverage and combined results in full-sweep report |
| Forms and interaction | All form controls, engines, native forms, date/time, menus and overlays | Implemented; detailed coverage and combined results in full-sweep report |
| Presentation and delivery | Actions, display, feedback, layout, primitives, styles, package consumers and browser matrix | Implemented; detailed coverage and combined results in full-sweep report |

New reusable surfaces include exact-number editing, request/session scopes, detailed HTTP responses,
provider-owned Google identity and reactive component locale defaults. Their source specs define the contracts.
A source inventory or smoke render does not establish every interaction; final coverage records name
reviewed groups, focused behavior tests, combined gates and remaining limits separately.

---

## Gap-close queue

Source: [gap analysis](../architecture/analysis/vue-sdk-gap-analysis.md). Each row ships source, spec, gallery
fixture, focused DOM tests and the SSR/mount breadth cases, and passes the package gates.

G1–G6 local gates (2026-09-26): typecheck + 423 SFCs · lint · format · 168 files / 2,153 unit/DOM/SSR tests
(107 new here) · Chromium, forced-colors and WebKit 21 files / 81 tests (24 new) · build, packed consumer
(79 exports, budgets held), playground build and seven-group gallery smoke. The last three-line
`DropdownMenuContent` fix and demo tweaks postdate that build; a concurrent lane was editing packaging, so the
rebuild waits for the next release run. Firefox still cannot launch on the macOS host; CI owns it.
G7–G13 local gates (2026-09-28): typecheck + 449 SFCs · lint · format · 194 files / 2,296 unit/DOM/SSR tests ·
Chromium, forced-colors and WebKit 36 files / 99 tests · build and packed consumer (81 exports, budgets held) ·
playground build and gallery smoke. A playground pass caught two layout bugs the tests then pinned: the crop
editor collapsed inside shrink-wrapping parents, and rail-mode groups showed icon-less rows.
Unpublished; consumer notes are in [MIGRATION.md](../codebase/wow-two-front-vue-beta-sdk/MIGRATION.md).

| It | Scope | Status |
|---|---|---|
| G1 | Menu vector — `MenuCheckboxItem`, `MenuRadioGroup`/`MenuRadioItem`, `MenuSub`/`MenuSubTrigger`/`MenuSubContent` across dropdown, context and menubar; `DropdownMenuContent` stray-surface fix | ✅ 20 DOM + 3 browser tests |
| G2 | Controls — `RatingPicker`, `RangeSliderInput` | ✅ 17 DOM tests |
| G3 | Overlay — `ConfirmPopover` with async confirm | ✅ 7 DOM + 1 browser test |
| G4 | Display and state — `TruncatedText`, `CountdownText`, `ErrorBoundary` | ✅ 16 DOM + 2 browser tests |
| G5 | Layout — `StickyLayout`, `VirtualScrollArea` | ✅ 7 DOM + 2 browser tests |
| G6 | Localized accessible names — `KnobInput`, `IconPicker`, `JsonEditorTreeNode` | ✅ 3 DOM tests |
| G7 | `DataTable` depth — selection, expandable rows, sticky header, loading state on `foundation/selection`; declined controlled toggles revert | ✅ 12 DOM tests |
| G8 | Hierarchical pickers — `TreeSelectPicker`, `CascaderPicker`, `TransferPicker` | ✅ 11 DOM tests |
| G9 | Period pickers — `MonthPicker`, `YearPicker` on a shared index-space `PeriodGrid` | ✅ 6 DOM tests |
| G10 | App navigation — `SidebarMenu` (+ `Item`/`Group`/`Section`, icon rail), `BottomNavMenu` | ✅ 8 DOM tests |
| G11 | Media — `LightboxModal`, `ImageCropEditor`, `SignatureInput` (was `SignaturePad`; `*Input` holds a form value) | ✅ 11 DOM + 4 browser tests |
| G12 | `MentionInput` | ✅ 4 DOM + 1 browser test |
| G13 | Small gaps — `KanbanBoard`, `MasonryLayout`, `OverflowGroup`, `TimezonePicker`, `DurationInput` (`Tag` already closes via `@close`) | ✅ 17 DOM + 1 browser test (`KanbanBoard` + `KanbanColumn` / `KanbanCard`) |

---

## Component sweep S1–S8 (2026-09-28)

Scan of 420 SFCs (`scratchpad` script, reproducible from the rules below): 223 have no focused test beyond the
render/SSR smoke registry; 33 own `disabled`, 31 `readonly`, 14 `readOnly` and 21 `required` flags that the props
convention names `isDisabled` / `isReadOnly` / `isRequired` ("must still take `is*` on a state flag the component
owns and publishes"); 59 hand-written Field fallbacks; 22 files carry `eslint-disable`.

| It | Scope | Status |
|---|---|---|
| S1 | Form state: `isDisabled` / `isReadOnly` / `isRequired` on every owning input; legacy names stay one release as deprecated aliases | ✅ 30 inputs + date predicate → `isDateDisabled`; 8 DOM tests; internal usages and demos migrated |
| S2 | Focused tests for interactive parts without one | ✅ 17 tests: toolbar, disclosure, tree, collapsible, tag, editable, composer, swatches, progress, date range — which caught a real `DateRangePicker` bug (a saved range closed on open) |
| S3 | `eslint-disable` audit — remove or justify each | ✅ all 25 justified (empty exported contracts, control-char regex, schema namespace, escaped v-html) |
| S4 | Playground: overlays render on request; link to the atlas | ✅ 0 dialogs open on load (was 7); `?smoke=1` still mounts all |
| S5 | Themes: port the Wheelhouse glass themes and the ambient token from React | ✅ 188 themes; glass foregrounds corrected to this SDK's stricter AA pairs; existing palettes byte-identical |
| S6 | Atlas: theme generator + CSS export (was the React theme studio) | ✅ `#/studio`: OKLCH seed → live light/dark preview of real components, both-mode contrast report, apply to the atlas, export as runtime module / CSS / token JSON; the seed is the link. SDK: `contrastPairRatio` + `ContrastPair` exported |
| S7 | Atlas: real-component screens beside the wireframes (was the React showcase) and atlas tests | ✅ `#/screens`: dashboard, board, settings, inbox, each linked to its archetype; 32 atlas tests (content graph, codecs, pages, screens). Building them caught a `DataTable` bug: a column `cell` returning a VNode crashed the table |
| S8 | Unprefixed idioms (`closeOnSelect`, `dismissOnEscape`, `hideBackdrop`, `hideFirstLast`, …) — names need a decision | ⬜ decision |
| S9 | Focused tests, second batch: interactive parts still covered only by the render smoke | ✅ 79 tests across wizard, emoji, phone, cron, sheets, hover card, callouts, radio group and field wrappers — 13 real defects fixed: wizard panels unnamed + no strip keys; emoji recents flag always skipped recents + grid stop stale after a click; phone submitted a bare dial code; cron rejected Sunday = 7 and flagged empty; action sheet dropped `aria-label`; sheet handle unnamed; hover card opened on touch; a 7-character password rated Strong; count and meter spoke nothing useful; `SwitchField` uncontrolled stuck off; six wrappers ignored the Field's disabled / required (cast `false`); a declined controlled radio pick moved the dot |
| S11 | Contrast: tone colors used as text | ✅ solid `text-success` / `-warning` / `-primary` fail AA as text in 367 / 192 / 169 of 752 theme-surface pairs; 28 files moved to the `-soft-foreground` text tokens (AA in all 752); guard test `ToneText.test.ts` with the reviewed graphic tone maps as exceptions |
| S10 | Final gates: browser matrix (chromium, forced colours, webkit), build, packed consumer, playground and atlas builds | ✅ typecheck (449 SFCs), lint, format; 210 files / 2,439 unit-DOM-SSR tests; browser 36 files / 99 tests; build (188/188 themes pass); packed consumer (81 exports); playground build + gallery smoke; atlas build |
| S12 | Focused tests, third batch: address, font and reaction pickers, markdown toolbar, banners, back-to-top | ✅ 10 tests; rename sweeps had leaked component names into UI text ("CodeText postal", "SelectPicker font…", toolbar names "InlineLayout code" / "LinkItem" / "ListGroup") — repaired, toolbar names now localized; FontPicker search unnamed and list without arrows; ReactionPicker toolbar without roving, English-only names. Re-gated: 212 files / 2,449 tests, browser 99, build, packed consumer, playground smoke, atlas build |
| S13 | Focused tests, fourth batch: display and layout logic | ✅ 16 tests, 7 defects fixed: `HighlightText` whole-word missed every non-ASCII word and let `java` beat `javascript`; `Avatar` initials had no name and split astral characters; the group chip read "+2"; `SwipeActionsLayout` actions were `aria-hidden` yet focusable, with no keyboard path; off-screen carousel slides stayed tabbable; dev-build fragment roots (60 comment-led templates) left `as-child` triggers without an element — new `resolveElement` in `foundation/dom`, guard `FragmentRoots.test.ts`; consumer-colored calendar, schedule and Gantt blocks kept dark text on dark fills — new `readableForeground` in themes |
| S14 | Atlas screens, second set: wizard, data console, docs, canvas islands — real SDK compositions per archetype | ✅ 8 screens now (`#/screens`); 7 new tests (flows, filter-resets-page, bulk edit, outline, islands) + registry test. Found: `TableOfContents` hash links navigated a hash-routed app away — new `canUpdateHash` (follow in place, focus the heading) |
| S15 | Focused tests, fifth batch: overlays and feedback | ✅ `LoadingOverlay` covered the page but let Tab reach and trigger controls under it — now a focus trap that hands focus back; `BackdropOverlay` / `LoadingOverlay` fade-in keyed on `data-[state=isOpen]`, which no element ever has (rename damage) — guard `RenameDamage.test.ts` for state selectors and component names in labels. Re-gated: 218 files / 2,477 tests, browser 99, build, packed consumer, playground smoke, atlas build |
| S16 | Gap-analysis leftovers: localized names for `KnobInput`, `IconPicker`, `JsonEditorTreeNode` toggles | ✅ already localized; the analysis rows were stale and are ticked |
| S17 | Density scale (shell preset, first slice): `data-density` compact / comfortable / spacious over Tailwind's `--spacing`; lab and screens switch | ✅ `data-density` sets `--spacing` and the `--ui-density-scale` hook `Button` already read (nothing set it); `Density` in `foundation/styles`; chromium test measures 87.5% / 112.5% heights with type unchanged; atlas Screens page has a density switch kept in the link |
| S18 | Atlas scaffold export: a starter SFC from any lab composition, copyable | ✅ `content/scaffold.ts` writes regions, SDK components and placeholder data for every nav, strip, panel mode and content kind; the lab shows it live with a copy button; 22 tests compile every output with `vue/compiler-sfc` and check each tag is imported from the entry that exports it |
| S19 | Atlas device preview: real screens in a phone / tablet frame at their true widths (iframe route) | ✅ Screens page Device switch; phone 390 / tablet 820 load `#/frame/{id}` — the screen alone — in an iframe, so viewport media queries apply for real (verified: inbox drops its customer panel at 390px); the frame follows theme and dark mode through `storage` events; 3 tests |
| S20 | Phone-first screens: inbox and settings as list → detail with a back step at phone width (the 390px frame shows them stacking) | ⬜ |
| S21 | Shell presets, second slice: `data-surface` (flat · cards · islands · glass), gutter and canvas tokens, driven from the lab | ⬜ |
