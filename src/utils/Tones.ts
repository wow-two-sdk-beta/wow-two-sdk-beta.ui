import type { Tone } from './StyleTokens';

/* Contains the (variant-family × tone) → Tailwind class lookup shared between
   `surfaceVariants` and `buttonVariants` (and any future variant config). */

/** Represents a tone-family — the variant group that picks the same bg/border/text palette. */
export type ToneFamily = 'solid' | 'soft' | 'surface' | 'outline' | 'glass' | 'glassOutline';

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
  /** Muted/tinted bg + tone-readable foreground. */
  soft: {
    neutral: 'bg-muted text-foreground',
    primary: 'bg-primary-soft text-primary',
    danger: 'bg-destructive-soft text-destructive',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    info: 'bg-info-soft text-info',
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
  /** Transparent bg, tone border + tone text. */
  outline: {
    neutral: 'border-border text-foreground',
    primary: 'border-primary text-primary',
    danger: 'border-destructive text-destructive',
    success: 'border-success text-success',
    warning: 'border-warning text-warning',
    info: 'border-info text-info',
  },
  /** Translucent tone bg + blur — used by `glass`. */
  glass: {
    neutral: 'bg-popover/70 text-popover-foreground',
    primary: 'bg-primary/30 text-primary-foreground',
    danger: 'bg-destructive/30 text-destructive-foreground',
    success: 'bg-success/30 text-success-foreground',
    warning: 'bg-warning/30 text-warning-foreground',
    info: 'bg-info/30 text-info-foreground',
  },
  /** Glass + tone-accent border at 50% alpha. */
  glassOutline: {
    neutral: 'border-border/50 bg-popover/70 text-popover-foreground',
    primary: 'border-primary/50 bg-primary/30 text-primary-foreground',
    danger: 'border-destructive/50 bg-destructive/30 text-destructive-foreground',
    success: 'border-success/50 bg-success/30 text-success-foreground',
    warning: 'border-warning/50 bg-warning/30 text-warning-foreground',
    info: 'border-info/50 bg-info/30 text-info-foreground',
  },
};
