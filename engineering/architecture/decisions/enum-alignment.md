# Enum alignment (R1 sweep)

*Last updated: 2026-07-07*

> Campaign to bring every string-literal value-set in `@wow-two-beta/ui` onto the const-object enum rule
> ([`enums.md §8`](../../../../../../conventions/development/frontend/code-style/enums.md)) — no bare `type X='a'|'b'`, no inline
> `prop?:'a'|'b'`, no `VariantProps<>`-only variant axis a consumer names by string. ~200 conversions across ~120 components.
> This doc is the canonical reference for the whole sweep: recipe + shared-enum registry + execution lanes.

## Status

Accepted 2026-07-07. Decisions: **shared-first consolidation** · **full sweep, staged** · rides with **ToggleButtonGroup feature + scroll-viewport primitive + bracket-array codemod**. Numeric gap/column tokens (`'0'|'2'|'4'`) stay structural (not enums).

---

## Rule (what R1 targets)

- must convert a **closed string vocabulary consumed as a prop** — a `tv()` variant axis (`variant`/`tone`/`shape`/`size`), a standalone `type X='a'|'b'`, or an inline `prop?:'a'|'b'`.
- must **not** convert: a boolean axis (`fullWidth`/`wrap` → `{true,false}`), an open dimension (`SizeValue = string|number`), a composite (`Token|{…}`), a numeric union (`Elevation = 0|1|2`), a `number|'sentinel'` mix, a `data-*`/ARIA attribute literal expression, an `Omit`/`Pick` prop-key union, or a value re-derived off an external type (`AnchoredPositionerProps['placement']`).
- must **not** touch `*.test.tsx` / `*.stories.tsx`.

---

## Recipe — the const-object enum

### Shape (`enums.md §3–5`)

```typescript
/** Defines the Button visual surface style. */
export const ButtonVariant = {
  /** Refers to an opaque, filled surface. */
  Solid: 'solid',
  /** Refers to a glass surface with a hairline border. */
  GlassSurface: 'glass-surface',
} as const;

export type ButtonVariant = (typeof ButtonVariant)[keyof typeof ButtonVariant];
```

- must JSDoc the const `Defines …` and each member `Refers to …`; derive the type on its own line, blank line before.
- **value is immutable** — it is the wire/CSS/`tv` key; preserve it verbatim. Only the **key** is normalized to a legal PascalCase identifier.

| Existing value | Key | Value kept |
|---|---|---|
| `'glass-surface'` | `GlassSurface` | `'glass-surface'` |
| `'mod-enter'` | `ModEnter` | `'mod-enter'` |
| `'2xl'` | `Xxl` | `'2xl'` (key can't start with a digit) |
| `'DAILY'` / `'MO'` | `Daily` / `Monday` | `'DAILY'` / `'MO'` (RFC wire values) |

### File location + name

- **component-own axis** (variant/shape/tone unique to one component) → fold the enum into that component's existing **`X.variants.ts`** (next to its `tv()`); do not spawn `ButtonVariant.ts`.
- **shared ≥2 components** → `src/foundation/utils/{Name}/{Name}.ts`, one enum per file, value+type exported through `foundation/utils/index.ts` (see Registry).
- const name = PascalCase **singular**, no `Enum`/`s` suffix (`ButtonVariant`, not `ButtonVariants` — that name is the `VariantProps` type).

### tv() reconciliation — pattern (a)

`tv()` keeps its **literal** variant keys (its type inference + `compoundVariants` autocomplete require them). The enum is the added **public value source**. A compile-time assert forbids drift — no runtime duplication, divergence is a type error:

```typescript
export type ButtonVariants = VariantProps<typeof buttonVariants>;

/* Compile-time lock: enum values ≡ tv variant/tone keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertButtonVariant: AssertExact<
  ButtonVariant, NonNullable<VariantProps<typeof buttonVariants>['variant']>
> = true;
```

> **tailwind-variants 0.3.1 note:** `VariantProps<typeof x>['axis']` *is* the value union — do **not** wrap it in `keyof` (that yields `never` and the assert fails). Use `NonNullable<VariantProps<typeof x>['axis']>` directly.

### Props wiring

Swap only the converted axes off the raw `VariantProps` union; keep the rest:

```typescript
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'disabled' | 'color'>,
    Omit<ButtonVariants, 'size' | 'variant' | 'tone'> {
  /** The visual surface style. */
  variant?: ButtonVariant;
  /** The semantic tone palette. */
  tone?: ColorTone;   // shared registry enum, not a local ButtonTone
}
```

Call sites (`buttonVariants({ variant, tone })`, `tone as ColorTone`) are **untouched** — value identity.

### Barrel + beta

- a component-own variant enum **is** re-exported (it's public prop API): add const+type to the component `index.ts`; area barrel `export *` propagates it.
- a shared foundation enum switches `foundation/utils/index.ts` from `export type { X }` to value+type `export { X }`.
- a purely internal state enum stays unexported (`ButtonDataState`).
- **beta = fix-forward, no aliases, no `@deprecated` shim.** Renaming a raw union to an enum is a breaking prop-type change; it lands normally, consumers pin exact versions.

---

## Shared-enum registry (G1)

Canonical shared enums (home `src/foundation/utils/{Name}/`, value+type via the utils barrel). Area agents **import these — never re-mint**. Widening a narrower prop (a `sm|md|lg` prop adopting the 5-member `Size`) is acceptable for beta.

| Enum | Members (`Key: 'value'`) | Home | Replaces |
|---|---|---|---|
| `ColorTone` | `Primary·Neutral·Danger·Success·Warning` | `ColorExtensions` (convert existing) | Button/Link/FAB/Toggle `tone`; most `tone?` inline |
| `Tone` | `ColorTone` + `Info` (6, superset) | `StyleTokens` (convert existing) | `Tones` record key; StyleTokens `Tone` |
| `Severity` | `Neutral·Info·Success·Warning·Danger` | **new** `foundation/utils/Severity/` | alert/banner/toast/callout `severity` |
| `Size` | `Xs·Sm·Md·Lg·Xl` | `StyleTokens` (convert existing) | all `sm\|md\|lg` / `xs\|sm\|md` size props |
| `SizePreset` | `Size` + `Xxl:'2xl'` (6, superset) | `CssExtensions` (convert existing) | CssExtensions `SizePreset` |
| `Radius` | `None·Sm·Md·Lg·Xl·Xxl:'2xl'·Full` | `StyleTokens` (convert) | `Radius` + `RadiusToken` (dedupe) |
| `Padding` | `None·Xs·Sm·Md·Lg·Xl·Xxl:'2xl'` | `StyleTokens` (convert) | `Padding` + `PaddingToken` (dedupe) |
| `Orientation` | `Horizontal·Vertical` | **new** `foundation/utils/Orientation/` | ~12 inline orientation (forms/layout/nav/actions/display/feedback) |
| `Align` | `Start·Center·End` | **new** `foundation/utils/Align/` | simple align/justify (cluster/inline/dataGrid/timeline/descriptionList) |
| `Side` | `Top·Right·Bottom·Left` | **new** `foundation/utils/Side/` | DrawerSide, chevronSide, switchField side, twoColumn asideSide |
| `CornerPosition` | `TopRight:'top-right'·TopLeft·BottomRight·BottomLeft` | **new** `foundation/utils/CornerPosition/` | badgeOverlay/notificationDot/presenceIndicator position |
| `OverlayPosition` | `CornerPosition` + `TopCenter·BottomCenter` (6) | **new** `foundation/utils/OverlayPosition/` | toaster/undoBar; FAB/BackToTop/SpeedDial |
| `ProgressTone` | `Brand·Success·Warning·Danger·Neutral` | **new** `foundation/utils/ProgressTone/` | progressBar/progressCircle tone |
| `StatusTone` | `Success·Warning·Destructive·Info·Neutral` | **new** `foundation/utils/StatusTone/` | Status dot + StatusIndicator (promoted in reconciliation — 2 identical local mints collided at the root barrel; `destructive`≠`danger`, its own enum) |
| `ElementTag` | `Span·Div·P·H1·H2·H3·H4·H5·H6·Section·Article·Li` | **new** `foundation/utils/ElementTag/` | polymorphic `as` (countUp/typewriter/animatedNumber/tilt/gradientText/scrollReveal) |
| `Direction` | `Ltr·Rtl` | `DirectionProvider` (convert existing) | keep home |
| `ColorMode` | `Light·Dark` | `ColorModeProvider` (convert existing) | keep home |

**Do NOT force-merge divergent semantic sets** into `ColorTone`/`Align`: `SpinnerTone` (`default·brand·muted·current`) · `TypingTone` (`muted·primary·foreground`) · flex-rich `StackAlign`/`StackJustify` (`stretch·baseline·between·around·evenly`) · `ScrollAxis` (`vertical·horizontal·both`) · `InlineAlign` (+`baseline`) stay component-local. (`StatusTone` keeps `destructive`≠`danger` but is its own shared enum — see registry.)

---

## Local-vs-shared decision rule

- value-set appears in **≥2 components** and is generic (orientation/size/tone/align/side/position) → **shared** registry enum.
- value-set is **unique to one component** or **semantically its own** (`ButtonVariant`, `ChatStatus`, `RecurrenceFreq`, `DataGridCellType`, `EventCalendarView`, `DrawerSize`, `ModalRole`, `GradientKind`) → **local** enum in its `X.variants.ts` / component file.
- member list **diverges** from the registry (extra/renamed members) → local enum; do not bend the registry.

---

## Execution lanes

Disjoint file sets (agentic-workflow lane discipline). **G1 lands + typechecks green before G2–G8 launch.**

| Lane | Owns | Depends on |
|---|---|---|
| **G0/G1** foundation + Button | `src/foundation/**` + `src/presentation/actions/button/**` | — (first, serial) |
| **G2** actions (rest) | `actions/**` except `button/` | G1 registry |
| **G3** display | `presentation/display/**` | G1 |
| **G4** feedback | `presentation/feedback/**` | G1 |
| **G5** forms | `presentation/forms/**` | G1 |
| **G6** layout | `presentation/layout/**` | G1 |
| **G7** nav | `presentation/nav/**` | G1 |
| **G8** overlays | `presentation/overlays/**` | G1 |
| **GF** features | `toggleButtonGroup/` (role=tab + equal-width + pill) · new `foundation/primitives/scrollViewport/` | G1 |
| **GA** array codemod | `T[]`/`readonly T[]` → `ReadonlyArray<T>` lib-wide (`type-mapping.md`) | independent |

Per area agent: (1) adopt registry enums for generic vocab; (2) mint local enums for unique/divergent sets; (3) apply the tv-reconciliation assert on each `tv()` axis; (4) re-export component enums via barrels; (5) `pnpm exec tsc -p tsconfig.typecheck.json` for its slice must be clean.

Out of scope (deferred): UPPER_SNAKE→PascalCase consts · `T|null` field triage · `export default` triage · numeric gap/column token enums.

---

## Outcome (2026-07-07)

Landed in one campaign — **311 files** changed (+3879 / −1126), 12 new.

- **~165 string value-sets** converted to const-object enums across foundation + 8 presentation areas; **16 shared registry enums** (8 converted-in-place + 8 new: `Severity`·`Orientation`·`Align`·`Side`·`CornerPosition`·`OverlayPosition`·`ProgressTone`·`ElementTag`·`StatusTone`).
- Every `tv()` axis carries the keyof-free `AssertExact` drift-lock. Non-camelCase wire values preserved (`glass-surface`, `2xl`, RFC `DAILY`/`MO`).
- **GF features**: `ToggleButtonGroup` gained `role=tab` semantics (`itemRole`), equal-width tiles (`equalWidth`), `Pill` variant; new `scrollViewport` foundation primitive.
- **GA codemod**: 203 bracket-arrays → `ReadonlyArray<T>` (171) / `Array<T>` (32 mutated locals).
- **Verified**: `tsc` 0 errors · `eslint .` 0 · unit 194/194 · stories 753/753.

Follow-ups noted, not done: `twoColumn.asideSide` widened to 4-member `Side` (a `HorizontalSide` would be tighter); the deferred sweeps above.
