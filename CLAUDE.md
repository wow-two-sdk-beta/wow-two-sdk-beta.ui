# wow-two-sdk-beta.ui

## What is this

The `@wow-two-beta/ui` package — beta-forever React UI library for the wow-two ecosystem. Intentionally pre-1.0. Ship as much as possible to feed real consumers (haven first); distill into a clean `@wow-two/ui` only after the platform layer below stabilizes.

> **Beta-forever rules**: no CHANGELOG, no PR gates, no required tests, push directly to main, fix-forward when broken. CI builds + auto-bumps `0.0.y` on each main push.

## Casing convention

- Folders: `camelCase` (`numberInput/`, `actions/`, `inputPrimitives/`)
- Files: `PascalCase` (`Button.tsx`, `Button.spec.md`, `Button.stories.tsx`, `Button.variants.ts`)
- Index files: lowercase (`index.ts`)

## Per-component pattern

Every component lives in its own folder with this exact shape:

```
forms/numberInput/
├── NumberInput.tsx           ← implementation
├── NumberInput.spec.md       ← spec — written FIRST, fills docs/component-standard.md
├── NumberInput.stories.tsx   ← Storybook stories (1 per visual state at minimum)
├── NumberInput.variants.ts   ← tailwind-variants config
└── index.ts                  ← barrel
```

**Spec before code.** A new component begins as a `*.spec.md` filling out `docs/component-standard.md`. Implementation must satisfy spec. Stories cover every visual state in spec.

## Layout

- `src/tokens` `src/tailwind` `src/utils` `src/hooks` `src/icons` `src/primitives` — **foundation** (no upward deps; ESLint enforces). `src/primitives` is the L2 headless layer (Slot, Portal, FocusScope, AnchoredPositioner, etc.).
- `src/actions` `src/display` `src/feedback` `src/forms` `src/layout` `src/nav` — **domains** (may import foundation; may NOT import sibling domains; ESLint enforces)
- `docs/component-standard.md` — meta-template every `*.spec.md` fills
- `docs/architecture.md` — full layering rule + ESLint mechanics
- `docs/decisions/` — cross-component ADRs
- `.storybook/` — catalog config
- `apps/playground/` — Vite sandbox for ad-hoc prototyping

## Versioning

- `0.x.y` forever. CI auto-bumps `y` on every push to `main`.
- No semver guarantees. Consumers should pin exact versions if stability matters.
- Breaking changes go in normally — fix-forward in consumers.

## Stack

- React 19 · TypeScript strict · **Tailwind v4** (CSS-first via `@theme`) · `@floating-ui/react` · `@radix-ui/react-focus-scope` · `lucide-react`
- Build: `tsup` (ESM) + `tsc --emitDeclarationOnly` (DTS) · Dev: `vite` (in playground) · Catalog: Storybook 8 + `@tailwindcss/vite` plugin · Lint: ESLint 9 flat config + `eslint-plugin-boundaries`
- Pkg manager: `pnpm` workspace (root pkg + `apps/playground`)

## Working rules

- **Spec before code.** No `Component.tsx` without its `Component.spec.md`.
- **Foundation cannot import domains. Domains cannot import sibling domains.** ESLint blocks both.
- **Subpath exports per top-level src/ folder.** Consumers can pull just the slice they need.
- **One component per folder.** Multiple files share the folder; never flatten.
- **Default theme out-of-box.** Configure key tokens; rest defaults gracefully.

## Out of scope (deliberately deferred)

- No tests. If broken, send fix commit to `main`.
- No CHANGELOG. Git log is the changelog.
- No PR review. Push to main.
- No graduation/distill rule yet. Beta-forever until platform layer matures.
