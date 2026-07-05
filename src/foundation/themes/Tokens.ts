/* ---------------------------------------------------------------------------
 * The semantic token contract.
 *
 * Mirrors EXACTLY the semantic `--color-*` tokens declared in `src/index.css`
 * (the `@theme` block + its `.dark { }` overrides). A theme supplies a value
 * for every key in both light and dark modes; the CSS emitter writes them back
 * as `--color-{key}` under `.theme-{id}` / `.dark.theme-{id}`.
 *
 * Keep this in lock-step with `index.css`: add a semantic token there → add the
 * matching key here (and the generator will need to produce it).
 * ------------------------------------------------------------------------- */

/** The six tone families that each carry base / -foreground / -soft / -soft-foreground. */
export const TONE_FAMILIES = [
  'primary',
  'accent',
  'destructive',
  'info',
  'success',
  'warning',
] as const;

export type ToneFamilyName = (typeof TONE_FAMILIES)[number];

/** Surface + chrome tokens (everything that isn't one of the tone families). */
export const SURFACE_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'muted',
  'muted-foreground',
  'subtle-foreground',
  'inverse',
  'inverse-foreground',
  'border',
  'border-strong',
  'input',
  'ring',
] as const;

/** The four slot suffixes every tone family expands into. */
type ToneSlotSuffix = '' | '-foreground' | '-soft' | '-soft-foreground';

/** A single tone family expanded to its four token keys, e.g. `primary | primary-foreground | …`. */
type ToneFamilyTokens<F extends string> = F extends string
  ? `${F}${ToneSlotSuffix}`
  : never;

/**
 * Every semantic token key (the part after `--color-`).
 *
 * = surface/chrome tokens ∪ (each tone family × {base,-foreground,-soft,-soft-foreground}).
 * 15 surface + 6×4 tone = 39 keys total.
 */
export type SemanticToken =
  | (typeof SURFACE_TOKENS)[number]
  | ToneFamilyTokens<ToneFamilyName>;

/** A complete set of color values — one CSS color string per semantic token. */
export type TokenSet = Record<SemanticToken, string>;

/** Optional radius scale a theme may carry (maps to `--radius-{md,lg,xl}`). */
export interface RadiusScale {
  md: string;
  lg: string;
  xl: string;
}

/** The four slots of one tone family. */
export interface ToneSlots {
  base: string;
  foreground: string;
  soft: string;
  softForeground: string;
}

/**
 * The full, ordered list of every semantic token key — derived from the same
 * constants the type is built from, so it can never drift from `SemanticToken`.
 * Used by the validator/emitter to iterate exhaustively.
 */
export const SEMANTIC_TOKENS: readonly SemanticToken[] = [
  ...SURFACE_TOKENS,
  ...TONE_FAMILIES.flatMap(
    (f) =>
      [f, `${f}-foreground`, `${f}-soft`, `${f}-soft-foreground`] as SemanticToken[],
  ),
];

/** Write a tone family's four slots into a partial token set under the family's keys. */
export function applyToneSlots(
  target: Partial<TokenSet>,
  family: ToneFamilyName,
  slots: ToneSlots,
): void {
  target[family] = slots.base;
  target[`${family}-foreground`] = slots.foreground;
  target[`${family}-soft`] = slots.soft;
  target[`${family}-soft-foreground`] = slots.softForeground;
}
