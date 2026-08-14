import type { Tone } from '../StyleTokens';

/* Contains the (variant-family × tone) → Tailwind class lookup shared between
   `surfaceVariants` and `buttonVariants` (and any future variant config). */

/** Defines a tone-family — the variant group that picks the same bg/border/text palette. */
export const ToneFamily = {
  /** Refers to an opaque tone bg + foreground. */
  Solid: 'solid',
  /** Refers to a muted/tinted bg + tone-readable foreground. */
  Soft: 'soft',
  /** Refers to a popover bg + tone-accent border. */
  Surface: 'surface',
  /** Refers to a transparent bg, tone border + tone text. */
  Outline: 'outline',
  /** Refers to a translucent tone bg + blur. */
  Glass: 'glass',
  /** Refers to a glass fill + tone-accent border at 50% alpha. */
  GlassOutline: 'glassOutline',
  /** Refers to a low-alpha tinted fill + neutral border, no shadow. */
  Subtle: 'subtle',
} as const;

export type ToneFamily = (typeof ToneFamily)[keyof typeof ToneFamily];

/** Contains the cross-engine palette: bg / text (+ border where applicable) per tone-family × tone. */
export const Tones: Record<ToneFamily, Record<Tone, string>> = {
  /** Opaque tone bg + foreground. Used by `solid`, `elevated`, `flat`, button defaults. */
  solid: {
    neutral: 'bg-popover text-popover-foreground',
    primary: 'bg-primary text-primary-foreground',
    danger: 'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    info: 'bg-info text-info-foreground',
  },
  /**
   * Muted/tinted bg + tone-readable foreground.
   *
   * Pairs `bg-{tone}-soft` with `text-{tone}-soft-foreground`, the token minted for
   * exactly this background — `themes/validate.ts` asserts that pair at AA. The
   * full-strength `text-{tone}` is a *solid*-fill foreground: on the soft tint it
   * measured 2.07:1 for `warning` and 3.15:1 for `success`.
   */
  soft: {
    neutral: 'bg-muted text-foreground',
    primary: 'bg-primary-soft text-primary-soft-foreground',
    danger: 'bg-destructive-soft text-destructive-soft-foreground',
    success: 'bg-success-soft text-success-soft-foreground',
    warning: 'bg-warning-soft text-warning-soft-foreground',
    info: 'bg-info-soft text-info-soft-foreground',
  },
  /** Popover bg + tone-accent border. The "default" subtle look. */
  surface: {
    neutral: 'border-border bg-popover text-popover-foreground',
    primary: 'border-primary/40 bg-popover text-popover-foreground',
    danger: 'border-destructive/40 bg-popover text-popover-foreground',
    success: 'border-success/40 bg-popover text-popover-foreground',
    warning: 'border-warning/40 bg-popover text-popover-foreground',
    info: 'border-info/40 bg-popover text-popover-foreground',
  },
  /**
   * Transparent bg, tone border + tone text.
   *
   * The fill is transparent, so the text lands on whatever surface hosts the
   * component — the same situation `-soft-foreground` is toned for. Keeping the
   * border at full-strength `{tone}` preserves the tone read; only the text
   * darkens (light) / lightens (dark). Full-strength `text-{tone}` measured
   * 2.15:1 for `warning` on the default light background.
   */
  outline: {
    neutral: 'border-border text-foreground',
    primary: 'border-primary text-primary-soft-foreground',
    danger: 'border-destructive text-destructive-soft-foreground',
    success: 'border-success text-success-soft-foreground',
    warning: 'border-warning text-warning-soft-foreground',
    info: 'border-info text-info-soft-foreground',
  },
  /**
   * Translucent tone bg + blur — used by `glass`.
   *
   * `warning` is the one tone whose `-foreground` is not white (`#78350f`, picked
   * to stay legible on the *solid* amber fill). Over a 30% wash it disappears —
   * 1.23:1 in dark mode. `-soft-foreground` is the token toned for a tinted
   * backdrop, so `warning` uses it and lands light-on-dark like its siblings.
   */
  glass: {
    neutral: 'bg-popover/70 text-popover-foreground',
    primary: 'bg-primary/30 text-primary-foreground',
    danger: 'bg-destructive/30 text-destructive-foreground',
    success: 'bg-success/30 text-success-foreground',
    warning: 'bg-warning/30 text-warning-soft-foreground',
    info: 'bg-info/30 text-info-foreground',
  },
  /** Glass + tone-accent border at 50% alpha. Same foreground reasoning as `glass`. */
  glassOutline: {
    neutral: 'border-border/50 bg-popover/70 text-popover-foreground',
    primary: 'border-primary/50 bg-primary/30 text-primary-foreground',
    danger: 'border-destructive/50 bg-destructive/30 text-destructive-foreground',
    success: 'border-success/50 bg-success/30 text-success-foreground',
    warning: 'border-warning/50 bg-warning/30 text-warning-soft-foreground',
    info: 'border-info/50 bg-info/30 text-info-foreground',
  },
  /**
   * Low-alpha tinted fill + neutral `border-border`, no shadow. The understated
   * "tinted panel / section band" look — quieter than `soft`, flatter than `surface`.
   * Neutral fills from the muted token; coloured tones tint their `-soft` token at low alpha.
   */
  subtle: {
    neutral: 'border-border bg-muted/30 text-foreground',
    primary: 'border-primary/20 bg-primary-soft/60 text-foreground',
    danger: 'border-destructive/20 bg-destructive-soft/60 text-foreground',
    success: 'border-success/20 bg-success-soft/60 text-foreground',
    warning: 'border-warning/20 bg-warning-soft/60 text-foreground',
    info: 'border-info/20 bg-info-soft/60 text-foreground',
  },
};
