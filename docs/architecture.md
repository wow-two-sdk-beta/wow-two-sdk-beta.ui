# Architecture

The single architectural rule of `@wow-two-beta/ui`: **layered imports**.

## Layers

| Layer | Folders | May import | May NOT import |
|---|---|---|---|
| **Foundation** | `tokens` `tailwind` `utils` `hooks` `icons` `primitives` | other foundation | anything else |
| **Domain** | `actions` `display` `feedback` `forms` `layout` `nav` `overlays` | foundation, **any sibling domain** | root barrel |
| **Root** | `src/index.ts` | foundation, all domains | nothing else |

Foundation never reaches up. Root only assembles. Domains can compose across siblings — see "Cross-domain rule" below.

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

## Why the foundation rule

Foundation never depending on domains keeps `utils/`, `hooks/`, `icons/`, `primitives/` standalone. They can be lifted out to a `@wow-two-beta/core` package any time without touching component code.

## Cross-domain rule (revised 2026-05-04)

Originally, sibling-domain imports were forbidden — the goal was every domain lifting cleanly into its own repo. In practice this generated significant duplication: `Select` rebuilt popover internals; `DatePicker / TimePicker / DateRangePicker` each reconstructed `Portal + AnchoredPositioner + FocusScope + DismissableLayer` rather than importing `Popover` from `overlays/`.

**Rule today**: domains may import any sibling domain. Convention (not lint-enforced):

- **L3 atoms / L4 molecules** — should stay in-domain when natural. Reaching across is allowed but signals the component might belong in a shared layer or a different domain.
- **L5+ organisms** — compose freely across domains. `forms/DatePicker` may import `overlays/Popover` directly.

The lift-out story is preserved at the L3/L4 layer (atoms/molecules of any domain remain domain-local). When the day comes to split, L5+ wrappers rebuild against the standalone packages.

## Enforcement

`eslint-plugin-boundaries` configured in `eslint.config.js`. Two element types:

- `foundation` — `src/(tokens|tailwind|utils|hooks|icons|primitives)/**`
- `domain` — `src/(actions|display|feedback|forms|layout|nav|overlays)/*/**` with captured `domain` segment

Rules:

```
foundation → foundation only
domain     → foundation + any domain
root       → foundation + any domain
```

Violations fail `pnpm lint`. CI runs lint on every push.

## Atom & molecule rule (within domains)

A domain component lives in one of three tiers:

- **L3 atom** — imports only foundation. May not import another component (atoms never compose atoms).
- **L4 molecule** — composes L3 atoms or other L4s in the same domain. May import foundation freely. Cross-domain imports allowed but should be deliberate.
- **L5 organism / L6 pattern** — composes any component from any domain.

The L3-doesn't-import-L3 rule is convention (not lint-enforced) — when you find yourself wanting to compose two atoms, that composition is L4.

L3 atoms can use **L1 Icon** (it's foundation) and **L2 primitives** (Slot, Portal, FocusScope, etc.). When atom-on-atom composition is wanted, the result is L4.

## Domain-internal helpers

Each domain may co-locate non-component utility files alongside its component folders. Naming convention:

| Suffix | Use | Examples |
|---|---|---|
| `*Extensions.ts` | Helpers extending a built-in or external type | `DateExtensions.ts`, `ColorExtensions.ts` |
| `*Styles.ts` | Shared `tailwind-variants` style configs | `InputStyles.ts` |
| `*Helpers.ts` | Other domain-specific utilities | `FormHelpers.ts` |

These files are not exported from the domain barrel — they're consumed by the domain's components only. The "internal" signal is "absent from `index.ts`", not file naming.

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
