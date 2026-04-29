# Architecture

The single architectural rule of `@wow-two/ui-beta`: **layered imports**.

## Layers

| Layer | Folders | May import | May NOT import |
|---|---|---|---|
| **Foundation** | `tokens` `tailwind` `utils` `hooks` `icons` | other foundation | anything else |
| **Domain** | `actions` `display` `feedback` `forms` `layout` | foundation, components in **same** domain | sibling domains, root barrel |
| **Root** | `src/index.ts` | foundation, all domains | nothing else |

Foundation never reaches up. Domains never reach sideways. Root only assembles.

## Why this rule

When the package eventually splits — even if "beta-forever" stretches for years — every domain folder must lift cleanly into its own repo. Sibling-domain imports are the single most common reason that "let's split this monorepo" turns into a multi-week refactor.

Enforcing the rule from day 1 costs nothing. Letting it rot for 6 months costs weeks.

## Enforcement

`eslint-plugin-boundaries` configured in `eslint.config.js`. Two element types:

- `foundation` — `src/(tokens|tailwind|utils|hooks|icons)/**`
- `domain` — `src/(actions|display|feedback|forms|layout)/*/**` with captured `domain` segment

Rules:

```
foundation → foundation only
domain     → foundation + same domain only
root       → foundation + any domain
```

Violations fail `pnpm lint`. CI runs lint on every push.

## Anti-patterns this prevents

- `actions/button/Button.tsx` importing from `forms/input` → caught
- `tokens/colors.ts` importing from `actions/button` → caught
- Two domains both reaching for a shared helper → forces it to be promoted to `utils/` or `hooks/`, which is the right answer

## When the rule needs to bend

It doesn't. If you find yourself wanting to cross domains, the answer is one of:

1. The thing belongs in `utils/` or `hooks/` — promote it
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

Spec before code. Stories cover every visual state in spec.
