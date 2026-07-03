import type { CSSProperties } from 'react';

/* Tone vocabulary shared by tone-aware components (Button, Checkbox, ToggleButton, Tag, Alert, etc.). */
export type ColorTone = 'primary' | 'neutral' | 'danger' | 'success' | 'warning';

/* Explicit color overrides for the active tone's slot set. Pair with a base `tone` prop on the component. */
export interface ColorOverride {
  /* Main background / fill color. Drives `bg-{tone}`, `hover:bg-{tone}/X`, `active:bg-{tone}/X`, `border-{tone}`, `ring-{tone}`. */
  bg?: string;

  /* Text/icon color on top of `bg`. Drives `text-{tone}-foreground`. */
  text?: string;

  /* Light tinted background for soft variants. Drives `bg-{tone}-soft`. */
  soft?: string;

  /* Text on top of `soft` background. Drives `text-{tone}-soft-foreground`. */
  softText?: string;

  /* Focus ring color override (else inherits the component's tone). */
  ring?: string;
}

/* Accepted shapes for the `color` prop: a single seed string (lib derives rest) OR an explicit slot override object. */
export type ColorProp = string | ColorOverride;

/* Per-tone CSS variable name suffixes (after `--color-`). */
const TONE_TOKEN_MAP: Record<
  ColorTone,
  { main: string; fg: string; soft: string; softFg: string }
> = {
  primary: { main: 'primary',     fg: 'primary-foreground',     soft: 'primary-soft',     softFg: 'primary-soft-foreground' },
  neutral: { main: 'foreground',  fg: 'background',             soft: 'muted',            softFg: 'foreground' },
  danger:  { main: 'destructive', fg: 'destructive-foreground', soft: 'destructive-soft', softFg: 'destructive-soft-foreground' },
  success: { main: 'success',     fg: 'success-foreground',     soft: 'success-soft',     softFg: 'success-soft-foreground' },
  warning: { main: 'warning',     fg: 'warning-foreground',     soft: 'warning-soft',     softFg: 'warning-soft-foreground' },
};

/**
 * Convert a `color` / `colors` prop into a CSS-variable override style for
 * the active tone's slot set. Returned style overrides the component's theme
 * tokens locally — every Tailwind utility (`bg-{tone}`, `hover:bg-{tone}/X`,
 * `text-{tone}-foreground`, etc.) that references the var picks it up
 * automatically. No variant config refactor required.
 *
 * Single-seed mode (`input` is a string):
 * - `bg` ← seed
 * - `text` ← white (default contrast; override via `colors.text`)
 * - `soft` ← seed mixed 12% over white via `color-mix(in oklch, ...)`
 * - `softText` ← seed
 * - `ring` ← seed
 *
 * Object mode (`input` is a `ColorOverride`):
 * - Each slot independently overridable; unset slots retain the theme default.
 */
function toneColorOverride(
  input: ColorProp | undefined,
  tone: ColorTone | undefined,
): CSSProperties | undefined {
  if (input === undefined || input === null) return undefined;
  const activeTone = tone ?? 'primary';
  const tokens = TONE_TOKEN_MAP[activeTone];
  const out: Record<string, string> = {};

  if (typeof input === 'string') {
    out[`--color-${tokens.main}`] = input;
    out[`--color-${tokens.fg}`] = '#ffffff';
    out[`--color-${tokens.soft}`] = `color-mix(in oklch, ${input} 12%, white)`;
    out[`--color-${tokens.softFg}`] = input;
    out['--color-ring'] = input;
  } else {
    if (input.bg !== undefined) out[`--color-${tokens.main}`] = input.bg;
    if (input.text !== undefined) out[`--color-${tokens.fg}`] = input.text;
    if (input.soft !== undefined) out[`--color-${tokens.soft}`] = input.soft;
    if (input.softText !== undefined) out[`--color-${tokens.softFg}`] = input.softText;
    if (input.ring !== undefined) out['--color-ring'] = input.ring;
  }

  return Object.keys(out).length > 0 ? (out as CSSProperties) : undefined;
}

// =============================================================================
// Grouped namespace export
// =============================================================================

export const ColorExtensions = {
  toneColorOverride,
  TONE_TOKEN_MAP,
} as const;
