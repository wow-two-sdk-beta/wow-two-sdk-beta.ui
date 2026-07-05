/* ---------------------------------------------------------------------------
 * Theme validator — WCAG AA contrast checks across every text/surface pair.
 *
 * "Proven" = every paired (-foreground vs its surface/base) clears AA in BOTH
 * light and dark modes. Text pairs need ≥ 4.5:1; the focus `ring` (a UI
 * affordance, not text) needs ≥ 3:1 against the page background.
 * ------------------------------------------------------------------------- */

import type { Theme, ThemeMeta } from './Theme';
import { TONE_FAMILIES, type SemanticToken, type TokenSet } from './Tokens';
import { contrastRatioCss } from './Oklch';

/** WCAG AA thresholds. Text = normal-size body text; UI = non-text affordances. */
export const AA_TEXT = 4.5;
export const AA_UI = 3.0;

/** One foreground↔background pair to verify, with its required ratio. */
interface ContrastPair {
  /** Foreground token (text/icon/affordance color). */
  fg: SemanticToken;
  /** Background token the fg sits on. */
  bg: SemanticToken;
  /** Required minimum ratio (AA_TEXT or AA_UI). */
  min: number;
}

/**
 * The canonical set of pairs every theme must satisfy.
 * Surface text pairs + each tone family's solid/soft foreground pairs + ring.
 */
export function contrastPairs(): ContrastPair[] {
  const pairs: ContrastPair[] = [
    { fg: 'foreground', bg: 'background', min: AA_TEXT },
    { fg: 'card-foreground', bg: 'card', min: AA_TEXT },
    { fg: 'popover-foreground', bg: 'popover', min: AA_TEXT },
    { fg: 'muted-foreground', bg: 'muted', min: AA_TEXT },
    { fg: 'subtle-foreground', bg: 'background', min: AA_UI },
    { fg: 'inverse-foreground', bg: 'inverse', min: AA_TEXT },
    // Focus ring is a UI affordance against the page → AA_UI.
    { fg: 'ring', bg: 'background', min: AA_UI },
  ];

  for (const f of TONE_FAMILIES) {
    // Solid: foreground text on the saturated base.
    pairs.push({ fg: `${f}-foreground`, bg: f, min: AA_TEXT });
    // Soft: foreground text on the tinted soft surface.
    pairs.push({ fg: `${f}-soft-foreground`, bg: `${f}-soft`, min: AA_TEXT });
  }

  return pairs;
}

/** Check one token set (one mode) against the pair list. Returns failure strings. */
function checkMode(set: TokenSet, mode: 'light' | 'dark'): string[] {
  const failures: string[] = [];
  for (const { fg, bg, min } of contrastPairs()) {
    const ratio = contrastRatioCss(set[fg], set[bg]);
    if (ratio + 1e-3 < min) {
      failures.push(
        `${mode}: ${fg} on ${bg} = ${ratio.toFixed(2)} (need ${min.toFixed(1)})`,
      );
    }
  }
  return failures;
}

/**
 * Validate a theme's light AND dark token sets.
 * `contrastAA` is true only when both modes pass every pair.
 */
export function validateTheme(theme: Pick<Theme, 'light' | 'dark'>): ThemeMeta {
  const failures = [
    ...checkMode(theme.light, 'light'),
    ...checkMode(theme.dark, 'dark'),
  ];
  return failures.length === 0
    ? { contrastAA: true }
    : { contrastAA: false, failures };
}
