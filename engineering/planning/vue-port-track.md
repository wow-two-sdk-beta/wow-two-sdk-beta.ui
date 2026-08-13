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
| W0 | Scaffold — package, Vite lib config, eslint boundaries, `release-vue.yml`, `index.css` | — | 🔄 |
| W1a | Agnostic core — 19 foundation modules + `domain/{color,emoji}` | ~14k LOC | 🔄 |
| W1b | `foundation/primitives` — 18 primitives, the headless layer | 1,407 LOC | 🔄 |
| W1c | `foundation/hooks` — 18 hooks → composables | 997 LOC | ⬜ |
| W1d | Remaining 21 foundation modules (engine copies + `useX` re-wrap) | ~18k LOC | ⬜ |
| W2a | `presentation/layout` 24 + `presentation/actions` 14 | ~5.2k LOC | ⬜ |
| W2b | `presentation/forms` 79 | ~4.7k+ LOC | ⬜ |
| W2c | `presentation/display` 73 | — | ⬜ |
| W2d | `presentation/{feedback 27, nav 11, overlays 9}` | — | ⬜ |
| W3 | `forms-engine` + `house` + `tanstack`(vue-form) | 2,529 LOC | ⬜ |
| W4 | Smoke tests (D6) + publish `0.0.1` + pipeline verify | — | ⬜ |
| W5 | `smart-qr` Vue frontend — the gate | 6,880 LOC | ⬜ |

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
