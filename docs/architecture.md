# Architecture

The single architectural rule of `@wow-two-beta/ui`: **layered imports**.

## Layers

| Layer | Folders | May import | May NOT import |
|---|---|---|---|
| **Foundation** | `tokens` `tailwind` `utils` `hooks` `icons` `primitives` | other foundation | anything else |
| **Domain** | `actions` `display` `feedback` `forms` `layout` `nav` | foundation, components in **same** domain | sibling domains, root barrel |
| **Root** | `src/index.ts` | foundation, all domains | nothing else |

Foundation never reaches up. Domains never reach sideways. Root only assembles.

## Foundation sub-layers

Foundation is internally ordered (informal — not ESLint-enforced, but respected by convention):

```
tokens   →  tailwind   ─┐
                        ├─→  primitives  →  domain
utils    →  hooks       ─┘
                        ↑
icons   ────────────────┘
```

- **`tokens`** — pure data. CSS values exposed as TypeScript objects + Tailwind preset.
- **`tailwind`** — preset that maps tokens to Tailwind theme. No JS at runtime.
- **`utils`** — pure helpers (`cn`, ref/event composition, polymorphic types, `tv` wrapper).
- **`hooks`** — pure React hooks (state, refs, observers). May use `utils`.
- **`icons`** — `<Icon>` registry. May use `utils`.
- **`primitives`** — headless components (Slot, Portal, FocusScope, etc.). Behavior + a11y only, no visuals beyond layout. May use `utils` + `hooks`. **This is L2.**

## Why this rule

When the package eventually splits — even if "beta-forever" stretches for years — every domain folder must lift cleanly into its own repo. Sibling-domain imports are the single most common reason that "let's split this monorepo" turns into a multi-week refactor.

Enforcing the rule from day 1 costs nothing. Letting it rot for 6 months costs weeks.

## Enforcement

`eslint-plugin-boundaries` configured in `eslint.config.js`. Two element types:

- `foundation` — `src/(tokens|tailwind|utils|hooks|icons|primitives)/**`
- `domain` — `src/(actions|display|feedback|forms|layout|nav)/*/**` with captured `domain` segment

Rules:

```
foundation → foundation only
domain     → foundation + same domain only
root       → foundation + any domain
```

Violations fail `pnpm lint`. CI runs lint on every push.

## Atom & molecule rule (within domains)

A domain component lives in one of three tiers:

- **L3 atom** — imports only foundation. May not import another component (atoms never compose atoms).
- **L4 molecule** — composes L3 atoms or other L4s in the **same** domain. May import foundation freely.
- **L5 organism / L6 pattern** — composes L4s + atoms in the same domain.

ESLint enforces *same domain* boundaries; the L3-doesn't-import-L3 rule is convention (not lint-enforced) — when you find yourself wanting to compose two atoms, that composition is L4.

L3 atoms can use **L1 Icon** (it's foundation) and **L2 primitives** (Slot, Portal, FocusScope, etc.). When atom-on-atom composition is wanted, the result is L4.

## Anti-patterns this prevents

- `actions/button/Button.tsx` importing from `forms/input` → caught
- `tokens/colors.ts` importing from `actions/button` → caught
- Two domains both reaching for a shared helper → forces it to be promoted to `utils/`, `hooks/`, or `primitives/`, which is the right answer

## When the rule needs to bend

It doesn't. If you find yourself wanting to cross domains, the answer is one of:

1. The thing belongs in `utils/`, `hooks/`, or `primitives/` — promote it
2. You have a domain misnamed — rename
3. You have two responsibilities glued together — split them

## Casing

- Folders: `camelCase`
- Files: `PascalCase` (component files, spec, stories, variants)
- Index: `index.ts` (lowercase, always)

## Per-component shape

```
{group}/{componentName}/
├── {ComponentName}.tsx
├── {ComponentName}.spec.md     ← written FIRST, fills component-standard.md
├── {ComponentName}.stories.tsx
├── {ComponentName}.variants.ts
└── index.ts
```

Spec before code. Stories cover every visual state in spec. Components without visual variants may omit `*.variants.ts`. Primitives (foundation) typically omit `*.stories.tsx` since they're headless.
