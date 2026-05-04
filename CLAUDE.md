# wow-two-sdk-beta.ui

## What is this

The `@wow-two-beta/ui` package — beta-forever React UI library for the wow-two ecosystem. Intentionally pre-1.0. Ship as much as possible to feed real consumers (haven first); distill into a clean `@wow-two/ui` only after the platform layer below stabilizes.

> **Beta-forever rules**: no CHANGELOG, no PR gates, no required tests, push directly to main, fix-forward when broken. CI builds + auto-bumps `0.0.y` on each main push.

## Tech catalog & roadmap

Source-of-truth for every UI tech, pattern, and browser API we may consider. Two co-located docs in [`docs/analysis/ui-philosophy/`](./docs/analysis/ui-philosophy/):

- **[`ideas.md`](./docs/analysis/ui-philosophy/ideas.md)** — every UI tech / pattern / framework / cross-cutting vector / component / delegate / browser API (full MDN encyclopedia) / React+client ecosystem (sketch) that exists in Web2. **No verdicts** — pure inventory. Source of ideas; read when considering scope expansion.
- **[`targets.md`](./docs/analysis/ui-philosophy/targets.md)** — verdict per item: **DONE / NOW / NEXT / LATER / MAYBE / SKIP / LOCKED**. Mirrors `ideas.md`'s structure. Read when deciding what to ship next; cross-references the [roadmap](../../../../docs/ui-beta-roadmap.md) for phase placement.

When scope expansion is considered, walk `targets.md` first. If the desired vector is missing or marked **MAYBE/LATER**, raise it for triage and update both files. Treat these two as a paired source-of-truth — when one changes, sync the other.

## Casing convention

- Folders: `camelCase` (`numberInput/`, `actions/`, `inputPrimitives/`)
- Files: `PascalCase` (`Button.tsx`, `Button.spec.md`, `Button.stories.tsx`, `Button.variants.ts`)
- Index files: lowercase (`index.ts`)

### Shared/internal helper files (within a domain)

Each domain may co-locate non-component utility files alongside its component folders. Use descriptive PascalCase + role-based suffix:

| Suffix | Use | Examples |
|---|---|---|
| `*Extensions.ts` | Helpers that extend a built-in or external type | `DateExtensions.ts`, `ColorExtensions.ts`, `StringExtensions.ts` |
| `*Styles.ts` | Shared `tailwind-variants` configurations | `InputStyles.ts`, `ButtonStyles.ts` |
| `*Helpers.ts` | Domain-specific utility fns that don't fit `Extensions` | `FormHelpers.ts` |

These files are not exported from the domain barrel — they're consumed by the domain's components only. The "internal" signal is "absent from `index.ts`", not file naming.

The `*Extensions.ts` postfix is borrowed from .NET extension methods — files of this shape extend an existing type with utilities. Most JS libs use camelCase for utilities; we deliberately diverge for consistency with the broader wow-two ecosystem (which is .NET-heavy).

## Per-component pattern

Every component lives in its own folder with this exact shape:

```
forms/numberInput/
├── NumberInput.standard.md   ← behavioral contract (what it MUST/SHOULD do — RFC 2119 rules + rationale)
├── NumberInput.spec.md       ← concrete API (enums, prop signatures, anatomy)
├── NumberInput.tsx           ← implementation (must satisfy both standard and spec)
├── NumberInput.stories.tsx   ← Storybook stories (1 per visual state at minimum)
├── NumberInput.variants.ts   ← tailwind-variants config
└── index.ts                  ← barrel
```

**Standard + spec before code.** A new component begins as `*.standard.md` (using [`docs/templates/component-standard.md`](./docs/templates/component-standard.md)) and `*.spec.md` (using [`docs/templates/component-spec.md`](./docs/templates/component-spec.md)). Implementation must satisfy both. Stories cover every visual state in spec.

## Layout

- `src/tokens` `src/tailwind` `src/utils` `src/hooks` `src/icons` `src/primitives` — **foundation** (no upward deps; ESLint enforces). `src/primitives` is the L2 headless layer (Slot, Portal, FocusScope, AnchoredPositioner, etc.).
- `src/actions` `src/display` `src/feedback` `src/forms` `src/layout` `src/nav` `src/overlays` — **domains** (may import foundation **and any sibling domain**; ESLint enforces only that domains may not reach upward into root)
- `docs/templates/component-standard.md` — template every `*.standard.md` fills
- `docs/templates/component-spec.md` — template every `*.spec.md` fills
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

- **Standard + spec before code.** No `Component.tsx` without its `Component.standard.md` *and* `Component.spec.md`.
- **Foundation cannot import domains.** ESLint enforces.
- **Domains can import any sibling domain.** Convention: L3 atoms / L4 molecules should stay in-domain when natural; L5+ organisms compose freely across domains. The lint rule is permissive — judgment calls go to the spec.
- **Subpath exports per top-level src/ folder.** Consumers can pull just the slice they need.
- **One component per folder.** Multiple files share the folder; never flatten.
- **Default theme out-of-box.** Configure key tokens; rest defaults gracefully.

## Out of scope (deliberately deferred)

- No tests. If broken, send fix commit to `main`.
- No CHANGELOG. Git log is the changelog.
- No PR review. Push to main.
- No graduation/distill rule yet. Beta-forever until platform layer matures.
