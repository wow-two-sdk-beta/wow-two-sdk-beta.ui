# Vue port — track

*Last updated: 2026-08-10*

> Track doc for `@wow-two-beta/ui-vue` — the Vue 3 port of `@wow-two-beta/ui`, living beside it at
> `engineering/codebase/wow-two-front-vue-beta-sdk`. **This file is the queue.**
>
> Why: the developer works faster in Vue, and the SDK's own measurements say the React ecosystem is no longer
> the reason to stay. Analysis: [`ideas/frontend-sdk-vue-port-analysis.md`](../../../../../ideas/frontend-sdk-vue-port-analysis.md)
> in `wow-two-ws`. Proof-of-value gate is a `smart-qr` frontend rebuilt on this package.

---

## Locked decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Package `@wow-two-beta/ui-vue`, `0.x.y` beta-forever | mirrors the React package's release contract |
| D2 | Vue 3.5+, `<script setup>` SFCs — **not** TSX | the DX gain is the entire point of the port |
| D3 | Vite library mode + `@vitejs/plugin-vue` + `vite-plugin-dts` | `tsup` cannot compile SFCs |
| D4 | **Self-contained** — copies the agnostic layer, no shared `core` package | pilot speed; drift only bites in a both-live-forever world, which this port exists to avoid |
| D5 | Subpath export map mirrors the React package 1:1 | a consumer swaps the specifier, nothing else |
| D6 | Tests = **smoke layer only** (mount + a11y per component) | full parity costs more than the components; write real tests once smart-qr proves out |
| D7 | `release-vue.yml` with a `paths:` filter, separate from `release.yml` | a React push must never publish the Vue package |
| D8 | `forms-engine` ships in v0.1; `router` / `query` / `auth` / `flags` / `analytics` defer to v0.2 | smart-qr imports `forms-engine` + `forms-engine/tanstack`; it imports neither `router` nor `query` |

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
| W1d | Remaining **20** foundation modules (engine copies + `useX` re-wrap) | ~18k LOC | 🔄 |
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

`/* @vue-ignore */` on `VariantProps`-derived heritage keeps the SFC compiler off `typeof someVariants`
entirely — a simpler alternative to rule 2's spelled-out union + `AssertExact`.
| W3 | `forms-engine` + `house` + `tanstack`(vue-form) | 2,529 LOC | 🔄 |
| W3b | `analytics` + `flags` + `auth` — headless top-level modules | ~1,835 LOC | 🔄 |
| W4 | Smoke tests (D6) + publish `0.0.1` + pipeline verify | — | ⬜ |
| W5 | `smart-qr` Vue frontend — the gate | 6,880 LOC | ⬜ |

| W3c | `router` + `query` onto `vue-router` / `@tanstack/vue-query` | 46 files | ✅ `1026bd7` |
| W4b | Root barrel + `MIGRATION.md` + README | — | 🔄 |

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

W2a is sequenced first inside W2 because it is `smart-qr`'s critical path.

---

## Lanes

Parallel agents edit one working tree on one branch. Disjoint file sets only — no worktrees.

| Lane | Owns | Never touches |
|---|---|---|
| scaffold | package root configs, `src/index.css`, `src/index.ts`, `release-vue.yml` | anything else under `src/` |
| agnostic-core | `src/domain/**` + its 19 `src/foundation/*` modules | `primitives`, `hooks`, `presentation`, root config |
| primitives | `src/foundation/primitives/**` | everything else |

Agents stage nothing and commit nothing — `guard-git.py` blocks `push`; the developer commits and pushes,
CI publishes `0.0.y`.

---

## Open

- **API naming** — keep the React package's exact export names in Vue, or redesign props idiomatically at
  the seam? D5 locks the *subpath* map; this is about component prop names. Unanswered.
- `@tanstack/vue-form`'s API differs from `react-form`; whether `AppForm` survives as-is or the facade is
  redesigned resolves once W3 starts.
