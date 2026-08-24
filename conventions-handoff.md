# Conventions sweep — handoff

*Last updated: 2026-07-07*

> State + remaining backlog for the frontend doc/enum convention sweep on `@wow-two-beta/ui`.
> The **Done** work is committed + pushed. This file lists what's **Left**, with rule + detection + recommendation per nit class, so the next chat can pick up without re-deriving.

## Done (pushed)

- **R1 enum alignment** — ~165 string value-sets → const-object enums + **16 shared registry enums** (`foundation/utils/`). Recipe, registry, tv-reconciliation, and outcome in [`docs/decisions/enum-alignment.md`](docs/decisions/enum-alignment.md).
  - Every `tv()` axis carries a keyof-free `AssertExact<Enum, NonNullable<VariantProps<t>['axis']>>` drift-lock.
  - `GA` codemod: 203 `T[]` → `ReadonlyArray<T>` (171) / `Array<T>` (32 mutated locals).
  - Features: `ToggleButtonGroup` gained `role=tab` (`itemRole`), `equalWidth` tiles, `Pill` variant; new `foundation/primitives/scrollViewport`.
- **Doc pass** (lib-wide): blank-line-between-members (310) · enum `Defines`/`Refers to` (5 enums, 26 members) · `*Props` member starter verbs `The …`/`Emits …`/`Fires when …` (491) · `/* */`→`/** */` on `*Props` members (69).
- **Verified**: `tsc` 0 · `eslint .` 0 · unit 194/194 · stories 753/753.

## Left — nit backlog (prioritized)

### Worth a sweep — clear rule, high value

| # | Nit | Count | Rule | Detect |
|---|---|---|---|---|
| 1 | Component-fn doc not `Renders` | ~185 | `documentation.md:44` | exported PascalCase const/fn in `.tsx`; doc 1st word ≠ `Renders` (`Render`/`Provide`/`Owns`/`Wrap`/descriptive) |
| 2 | Interface / ext-object type doc missing or `/* */` | ~340 (mixed) | `documentation.md:39-48` | `export interface X` or `export const X = {…} as const` w/o a `/** */` above. Ext objects (`ColorExtensions`…) → `Provides`; interfaces → `Defines` (shape) / `Represents` (data) |
| 3 | Hook doc not `Manages` / `Provides access to` | 17 | `documentation.md:46-47` | `export … use*`; doc 1st word ≠ `Manages`/`Provides` |
| 4 | `/* */` type-alias doc → `/** */` | 5 | `documentation.md:9` | `PaddingToken` · `ColorOverride` · `ColorProp` · `OverlayPosition` (`Overlay.tsx`) · `ButtonSize` (`Button.tsx`) |
| 5 | `React.*` UMD ref → named import | 96 | `code-organization.md` | `React\.[A-Z]` — only **1** file imports the namespace, so 96 are stray (`React.ReactNode` → `import { ReactNode }`) |

**Recommendation:** items 1–4 = one more **8-area doc sweep** (foundation + actions/display/feedback/forms/layout/nav/overlays), identical shape to the `*Props` pass that worked. Item 5 = an independent `React.*`→named-import codemod lane. All comments/imports-only → `tsc` + `eslint .` are the gate (they prove no logic changed).

### Defer / judgment — low yield

- `export default` (37) — mostly legit compound-component roots / lazy pages; audit case-by-case, don't blanket-convert.
- `UPPER_SNAKE` consts (17: `IS_DEV`, `POOL_SEEDS`, `AA_TEXT`, `TONE_FAMILIES`…) — `constants.md` mandates **gradual** migration; new code only.
- `T | null` fields (82) — mostly legitimate prop-nullability (`value: T | null` for a cleared state); per-field judgment, no blanket rewrite.
- `twoColumn.asideSide` widened to 4-member `Side` — a tighter `HorizontalSide` (`left`/`right`) would be cleaner (flagged in `enum-alignment.md` Outcome).

## How to re-scan

Scope: `src/**/*.{ts,tsx}` excluding `*.test.*` / `*.stories.*`.

- **Prop-doc verbs / delimiters:** walk each `interface *Props {}` body; a documented member's doc must open `The `/`Emits `/`Fires when `. `on*` or function-typed prop → callback (`Emits …` reports a value, `Fires when …` pure event); else value → `The …`.
- **Enum docs:** const-object `export const X = {…} as const` → const wants `/** Defines … */`, each `Key: 'val'` member wants `/** Refers to … */`, blank line before `export type X = …`. Skip a multi-line JSDoc when checking only the line directly above the const (false-positive trap).
- **Missing-doc:** flag `export interface` + const-enum without `/** */`; **exclude** derived enum types (`export type X = (typeof X)[keyof typeof X]`) and plain type aliases — they need no own doc.
- **Blank-line rule** (`models.md:56`): exactly one blank line between documented members of an `interface`/`type`-object; enums stay **compact** (members contiguous), blank line only before the derived type.

## Method notes (what worked)

- Lock the enum **recipe + shared registry first** (foundation lane), verify green, *then* fan out areas — prevents 8 agents minting divergent `Tone`/`Size`/`Orientation`.
- Per-area lanes = **disjoint file sets**; each agent self-verifies its slice, ignores transient cross-lane `tsc` noise; run the authoritative full `tsc` once all land.
- Cross-lane name collisions surface at the root barrel `export *` (`TS2308`) — e.g. two areas minted identical `StatusTone` → promote to a shared registry enum.
- Comments/whitespace-only passes: `tsc` staying 0 is proof no code was touched.
