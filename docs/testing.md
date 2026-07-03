# Testing — Plan

*Last updated: 2026-06-27*

> Test-layer design for `@wow-two-beta/ui`. **Analysis + plan only** — not yet executed.
> Philosophy mirrors the backend: behavior-first ("E2E covers most"), focused units only where E2E is awkward.

## Goal

A behavior-first test layer over ~250 components, 15 hooks, 20 utils, 17 primitives, and the `themes` engine.
Most coverage comes from **stories run as interaction tests in a real browser**; isolated unit tests are reserved for pure-logic surfaces.

## Principles

- **E2E-first.** Prefer real-browser interaction through the rendered component (covers component → hook → primitive → util in one test) over unit-testing each block. Same shape as backend E2E.
- **Stories are the vehicle.** 224 stories already exist → instant render-smoke; add `play()` to upgrade to interaction "E2E".
- **`.spec.md` / `.standard.md` are the oracle.** 201 spec docs already define per-component behavior — drive `play()`/RTL assertions from them.
- **Refactor-robust > granular.** Test behavior, not internals — cheaper to keep current as components churn.
- **CI-ready now, CI-wired later.** Deterministic + headless Playwright, no machine-specific assumptions. No CI job yet; add `pnpm test` to Actions when ready.
- **No visual regression yet.** Deferred until the design system freezes (see §Deferred).

## Stack

| Concern | Tool |
|---|---|
| Runner | `vitest` |
| Browser env | `@vitest/browser` + `playwright` (chromium, headless) |
| Story tests | `@storybook/addon-vitest` — runs every story incl. `play()` |
| Component API | `@testing-library/react` + `@testing-library/user-event` |
| `play()` utils | `storybook/test` (SB10: `expect`, `userEvent`, `within`, `fn`) |
| DOM matchers | `@testing-library/jest-dom` (via `/vitest`) |
| a11y | `vitest-axe` (+ `axe-core`) |
| Coverage (report-only) | `@vitest/coverage-v8` |

## Vitest workspace — two projects (speed split)

| Project | Env | Globs | Speed |
|---|---|---|---|
| `unit` | node | `src/{utils,themes}/**/*.test.ts` | ms — pure logic |
| `browser` | playwright chromium | `src/**/*.test.tsx`, `src/hooks/**/*.test.ts`, + `@storybook/addon-vitest` story project (`src/**/*.stories.tsx`) | slower |

- `unit` stays fast → quick local feedback; `browser` is the heavier tier the future CI job can isolate onto a Playwright runner.
- Hooks need a DOM (`renderHook`) → live in `browser` for real-browser fidelity (not jsdom).

## Tiers & targets

| Tier | Vehicle | Scope | Priority |
|---|---|---|---|
| **T1 — Smoke** | `addon-vitest` auto | all 224 stories: render, no throw / console-error | wire first (free baseline) |
| **T2 — a11y** | `vitest-axe` in the story pass | all stories | with T1 |
| **T3 — Interaction "E2E"** | `play()` in `*.stories.tsx` | ~70–90 logic-bearing components | core effort |
| **T4 — Focused unit** | `vitest` | `themes` engine + algorithmic hooks + key utils | alongside T3 |
| ~~T5 — Visual~~ | deferred | `*.matrix.stories` | post design-system freeze |

### T3 — logic-bearing set (driven by `.spec.md`, ordered by logic density)

- **forms:** `pinInput` `combobox` `select` `multiSelect` `datePicker` `dateRangePicker` `slider` `numberInput` `tagsInput` `colorPicker` `stepper` `maskedInput` `wizard` `cronInput` `recurrenceEditor`
- **overlays:** `dialog` `drawer` `popover` `alertDialog` `bottomSheet` `actionSheet` `hoverCard`
- **nav:** `menu` `dropdownMenu` `commandPalette` `menubar` `navigationMenu` `contextMenu` `pagination`
- **interactive display:** `tabs` `accordion` `collapsible` `tree` `dataTable` `dataGrid` `carousel` `sortable` `swipeActions`
- **primitives:** mostly covered transitively via consumers; targeted tests for `focusScope` `dismissableLayer` `rovingFocusGroup` `presence`

### T4 — focused unit set (where E2E is awkward)

- **`themes/` engine (highest value — silent a11y break if wrong):** `Oklch` color math, `contrastRatio`, `clampChromaToGamut`, `generate`, `validate`. **Golden-master:** every curated `THEMES` entry must pass WCAG AA.
- **algorithmic hooks:** `useControlled` (controlled/uncontrolled invariant), `useTypeahead` (match algorithm), `useDisclosure`.
- **key utils:** `Equality` (`shallowEquals`/`byKey`), `polymorphic`, `composeRefs`, `composeEventHandlers`, `KeyboardExtensions`.
- Everything else (`cn`, presentational atoms, trivial utils) is covered transitively — no bespoke test.

## Folder / file conventions

- **Domain components — already 1-per-folder** (`CLAUDE.md`: *"One component per folder"*). Co-locate: `Button/Button.test.tsx`. Interaction tests live **inside** `Button.stories.tsx` as `play()` — no extra file.
- **`themes/`, `icons/`** — cohesive modules; keep as-is, tests co-locate flat (`themes/Oklch.test.ts`).
- **No central `__tests__/`.** `*.test.ts(x)` always co-located.

### D1 — flat `hooks/` + `utils/` → **decided: Option A (fold)**

- Fold every `hooks/` + `utils/` file to its own folder: `hooks/useControlled/{useControlled.ts, index.ts}` (+ `useControlled.test.ts` when tested). Folder `index.ts` re-exports; parent barrels (`src/{hooks,utils}/index.ts`) + `tsup` entries unchanged.
- Each moved file gains one `../` depth on every relative import — uniform transform.
- `themes/` stays a cohesive module (tests co-locate flat). `icons/` unchanged (already foldered-enough: 2 files + barrel).
- Executed in **Iteration 1**.

## Iterations & tasks

Each iteration = a shippable chunk. Fold precedes harness so no test file moves twice.

| It | Focus | Tasks (one-liner each) | Status |
|---|---|---|---|
| **1** | Fold foundation (D1) | `hooks/`+`utils/` → 1-per-folder (`useX/{useX.ts,index.ts}`) · rewrite intra-/cross-dir relative imports (+1 `../`) · parent barrels unchanged · `pnpm typecheck`+`lint`+`build` green | **done** (2026-06-27) |
| **2** | Harness + T1 smoke | install deps · `vitest.config.ts` (`unit`+`browser` projects) · wire `@storybook/addon-vitest` · eslint `*.test.*` override · scripts · run 224 stories smoke → fix throwers | todo |
| **3** | T2 a11y | enable `vitest-axe` in story pass · triage violations vs `.spec.md` | todo |
| **4** | T4 units | `themes` golden-master (all `THEMES` pass AA) · `Oklch`/`contrastRatio`/`validate`/`generate` · `useControlled`/`useTypeahead`/`useDisclosure` · `Equality`/`polymorphic`/`composeRefs` | todo |
| **5** | T3 forms | `play()`: `pinInput` `combobox` `select` `multiSelect` `datePicker` `dateRangePicker` `slider` `numberInput` `tagsInput` `colorPicker` `stepper` `maskedInput` `wizard` `cronInput` `recurrenceEditor` | todo |
| **6** | T3 overlays + nav | `play()`: `dialog` `drawer` `popover` `alertDialog` `bottomSheet` `actionSheet` `hoverCard` `menu` `dropdownMenu` `commandPalette` `menubar` `navigationMenu` `contextMenu` `pagination` | todo |
| **7** | T3 display + primitives | `play()`: `tabs` `accordion` `collapsible` `tree` `dataTable` `dataGrid` `carousel` `sortable` `swipeActions` · targeted `focusScope` `dismissableLayer` `rovingFocusGroup` `presence` | todo |
| **8** | Docs + CI | update `CLAUDE.md` (drop "No tests", fix SB8→10, add commands) · add Actions job (`unit` always, `browser` on Playwright runner) | todo |

Scripts (added It2): `test` `test:watch` `test:ui` `test:unit` `test:browser` `coverage`.

## Coverage philosophy

- **No line-% gate.** "Done" = T1 + T2 green across all stories + T3 on the logic-bearing set + T4 on `themes`/key foundation.
- `coverage` script (v8) available for visibility, never as a gate.

## Deferred

- **Visual regression.** A visual test *is* its baseline → can't be "kept up to date" passively; while tokens/APIs churn it is high-noise/low-signal. Bridge: `*.matrix.stories` already render every variant combo for manual eyeballing. Adopt when design system freezes — `Chromatic` (hosted, review UI, no git binaries) vs Playwright local snapshots (offline, baselines in git).
- **Apps** (`playground` / `showcase` / `theme-studio`) — dev tooling, not shipped.
