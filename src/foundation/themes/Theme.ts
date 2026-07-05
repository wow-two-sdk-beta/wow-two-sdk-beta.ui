/* ---------------------------------------------------------------------------
 * Theme + Seed shapes.
 *
 * A `Theme` is a fully-resolved, validated pair of light/dark token sets plus
 * metadata. A `ThemeSeed` is the small, human-authorable recipe the OKLCH
 * generator expands into a `Theme` (see `generateTheme`).
 * ------------------------------------------------------------------------- */

import type { TokenSet } from './Tokens';

/**
 * Theme lifecycle status.
 *
 * - `validated` — hand-authored from real, visually-verified app tokens; the
 *   colors are locked (never auto-nudged), proven in a shipping product.
 * - `candidate` — generated/curated and AA-proven by the engine, but not yet
 *   validated against a real app surface.
 */
export const ThemeStatus = {
  Validated: 'validated',
  Candidate: 'candidate',
} as const;

/** A theme's lifecycle status value (`"validated"` | `"candidate"`). */
export type ThemeStatus = (typeof ThemeStatus)[keyof typeof ThemeStatus];

/** Contrast / "is this theme proven" metadata, produced by the validator. */
export interface ThemeMeta {
  /** True iff every foreground↔surface pair clears its WCAG AA threshold in BOTH modes. */
  contrastAA: boolean;
  /**
   * Human-readable pair failures (empty when `contrastAA` is true).
   * Each entry: `"<mode>: <fg> on <bg> = <ratio> (need <threshold>)"`.
   */
  failures?: string[];
}

/** A named, validated theme — the unit the registry stores and the emitter renders. */
export interface Theme {
  /** Stable kebab-case id; drives the `.theme-{id}` class. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description. */
  description: string;
  /** Free-form tags for filtering/search (e.g. `["dark","cool","brand"]`). */
  tags: string[];
  /** Light-mode token values. */
  light: TokenSet;
  /** Dark-mode token values. */
  dark: TokenSet;
  /** Border-radius scale knob (maps to the lib's `--radius-*`). Optional. */
  radius?: 'sm' | 'md' | 'lg';
  /** Lifecycle status — `validated` (real-app proven, locked) or `candidate` (engine-proven). */
  status: ThemeStatus;
  /** Validation result — `meta.contrastAA === true` ⇒ the theme is "proven". */
  meta: ThemeMeta;
}

/** Neutral surface temperature — biases the grey ramp warm/cool/neutral. */
export type NeutralTemp = 'cool' | 'neutral' | 'warm';

/** How the accent hue is derived from the primary hue. */
export type AccentMode = 'complementary' | 'analogous' | 'triadic' | 'mono';

/** Surface character — `soft` = gentle low-contrast surfaces, `crisp` = punchier separation. */
export type SurfaceStyle = 'soft' | 'crisp';

/**
 * The recipe a theme is generated from. Pure inputs → deterministic `Theme`
 * (no randomness; identical seeds always yield identical themes).
 */
export interface ThemeSeed {
  /** Stable kebab-case id for the produced theme. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line description (optional — a sensible default is derived from the seed). */
  description?: string;
  /** Tags to attach (generator also auto-tags temp/mode/scheme). */
  tags?: string[];
  /** Primary brand hue in degrees, 0–360. */
  primaryHue: number;
  /** Neutral ramp temperature. Default `neutral`. */
  neutralTemp?: NeutralTemp;
  /** Accent derivation. Default `complementary`. */
  accentMode?: AccentMode;
  /** Surface character. Default `crisp`. */
  surface?: SurfaceStyle;
  /** Radius knob to carry through. Optional. */
  radius?: 'sm' | 'md' | 'lg';
}
