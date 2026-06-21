import { tv, Tones, type VariantProps } from '../../utils';

/** Button visual surface — see Button.standard.md + Button.spec.md. */
export const buttonVariants = tv({
  base: [
    // layout
    'inline-flex items-center justify-center gap-2',
    // typography
    'font-medium align-middle',
    // borders (forced-colors fallback)
    'border border-transparent',
    'forced-colors:border-[ButtonBorder]',
    // transitions (color only)
    'transition-colors duration-150 ease-out',
    'motion-reduce:transition-none',
    // focus
    'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    // disabled (native attr handles click-blocking; pointer-events-none would
    // suppress the cursor visual, so we don't add it here)
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // skeleton state — wins over everything
    'data-[state=skeleton]:!bg-muted data-[state=skeleton]:!text-transparent data-[state=skeleton]:!border-transparent data-[state=skeleton]:!cursor-default data-[state=skeleton]:!pointer-events-none data-[state=skeleton]:animate-pulse',
    'data-[state=skeleton]:[&>*]:!invisible',
  ],
  variants: {
    variant: {
      solid: '',
      soft: '',
      surface: '',
      outline: 'bg-transparent',
      ghost: 'bg-transparent',
      link: 'bg-transparent !h-auto !p-0 !rounded-none underline-offset-4 hover:underline focus-visible:ring-offset-0',
      // Base = neutral/default tone: dark image-overlay wash + blur. Non-neutral tones resolve
      // through the shared `Tones.glass` palette via compoundVariants below (so tone + color
      // overrides apply). `backdrop-blur-md` stays here for every tone.
      glass: 'backdrop-blur-md',
      'glass-surface': 'backdrop-blur-md border-white/10',
    },
    tone: {
      primary: '',
      neutral: '',
      danger: '',
      success: '',
      warning: '',
    },
    size: {
      // min-h/min-w floor keeps the hit-target ≥ 24×24 (WCAG 2.2 SC 2.5.8) even when
      // --ui-density-scale < 1 would otherwise shrink it below the floor. Applies to
      // square/circle xs too (the min-h sets the box height; min-w the width).
      xs: 'h-[calc(1.5rem*var(--ui-density-scale,1))] min-h-6 min-w-6 px-[calc(0.5rem*var(--ui-density-scale,1))] text-xs rounded-sm gap-1',
      sm: 'h-[calc(2rem*var(--ui-density-scale,1))] px-[calc(0.75rem*var(--ui-density-scale,1))] text-sm rounded-md gap-1.5',
      md: 'h-[calc(2.5rem*var(--ui-density-scale,1))] px-[calc(1rem*var(--ui-density-scale,1))] text-sm rounded-md gap-2',
      lg: 'h-[calc(3rem*var(--ui-density-scale,1))] px-[calc(1.5rem*var(--ui-density-scale,1))] text-base rounded-lg gap-2',
      xl: 'h-[calc(3.5rem*var(--ui-density-scale,1))] px-[calc(2rem*var(--ui-density-scale,1))] text-base rounded-lg gap-2.5',
    },
    shape: {
      default: '',
      square: 'aspect-square !px-0',
      circle: 'aspect-square !px-0 !rounded-full',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
    wrap: {
      true: 'whitespace-normal text-left',
      false: 'whitespace-nowrap text-ellipsis overflow-hidden',
    },
  },
  compoundVariants: [
    // === SOLID × tone ===
    { variant: 'solid', tone: 'primary',  class: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95' },
    { variant: 'solid', tone: 'neutral',  class: 'bg-muted text-foreground hover:bg-muted/80 active:bg-muted/85' },
    { variant: 'solid', tone: 'danger',   class: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95' },
    { variant: 'solid', tone: 'success',  class: 'bg-success text-success-foreground hover:bg-success/90 active:bg-success/95' },
    { variant: 'solid', tone: 'warning',  class: 'bg-warning text-warning-foreground hover:bg-warning/90 active:bg-warning/95' },

    // === SOFT × tone ===
    { variant: 'soft', tone: 'primary',   class: 'bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/80 active:bg-primary-soft/85' },
    { variant: 'soft', tone: 'neutral',   class: 'bg-muted/60 text-foreground hover:bg-muted/80 active:bg-muted/85' },
    { variant: 'soft', tone: 'danger',    class: 'bg-destructive-soft text-destructive-soft-foreground hover:bg-destructive-soft/80 active:bg-destructive-soft/85' },
    { variant: 'soft', tone: 'success',   class: 'bg-success-soft text-success-soft-foreground hover:bg-success-soft/80 active:bg-success-soft/85' },
    { variant: 'soft', tone: 'warning',   class: 'bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80 active:bg-warning-soft/85' },

    // === SURFACE × tone (subtle tinted bg + visible tone-colored border) ===
    { variant: 'surface', tone: 'primary',  class: 'bg-primary/5 border-primary/40 text-primary hover:bg-primary/10 active:bg-primary/15' },
    { variant: 'surface', tone: 'neutral',  class: 'bg-muted/30 border-border-strong text-foreground hover:bg-muted/50 active:bg-muted/70' },
    { variant: 'surface', tone: 'danger',   class: 'bg-destructive/5 border-destructive/40 text-destructive hover:bg-destructive/10 active:bg-destructive/15' },
    { variant: 'surface', tone: 'success',  class: 'bg-success/5 border-success/40 text-success hover:bg-success/10 active:bg-success/15' },
    { variant: 'surface', tone: 'warning',  class: 'bg-warning/10 border-warning/40 text-warning hover:bg-warning/15 active:bg-warning/20' },

    // === OUTLINE × tone ===
    { variant: 'outline', tone: 'primary',  class: 'border-primary/50 text-primary hover:bg-primary/10 active:bg-primary/15' },
    { variant: 'outline', tone: 'neutral',  class: 'border-border-strong text-foreground hover:bg-muted/50 active:bg-muted/70' },
    { variant: 'outline', tone: 'danger',   class: 'border-destructive/50 text-destructive hover:bg-destructive/10 active:bg-destructive/15' },
    { variant: 'outline', tone: 'success',  class: 'border-success/50 text-success hover:bg-success/10 active:bg-success/15' },
    { variant: 'outline', tone: 'warning',  class: 'border-warning/60 text-warning hover:bg-warning/10 active:bg-warning/15' },

    // === GHOST × tone ===
    { variant: 'ghost', tone: 'primary',  class: 'text-primary hover:bg-primary/10 active:bg-primary/15' },
    { variant: 'ghost', tone: 'neutral',  class: 'text-foreground hover:bg-foreground/10 active:bg-foreground/15' },
    { variant: 'ghost', tone: 'danger',   class: 'text-destructive hover:bg-destructive/10 active:bg-destructive/15' },
    { variant: 'ghost', tone: 'success',  class: 'text-success hover:bg-success/10 active:bg-success/15' },
    { variant: 'ghost', tone: 'warning',  class: 'text-warning hover:bg-warning/10 active:bg-warning/15' },

    // === LINK × tone (h/padding/radius cleared by variant) ===
    { variant: 'link', tone: 'primary',  class: 'text-primary' },
    { variant: 'link', tone: 'neutral',  class: 'text-foreground' },
    { variant: 'link', tone: 'danger',   class: 'text-destructive' },
    { variant: 'link', tone: 'success',  class: 'text-success' },
    { variant: 'link', tone: 'warning',  class: 'text-warning' },

    // === GLASS / GLASS-SURFACE × tone ===
    // neutral = the image-overlay default: fixed dark wash + light text (reads over any imagery).
    { variant: ['glass', 'glass-surface'], tone: 'neutral', class: 'bg-black/45 text-white/70 hover:bg-black/65 hover:text-white active:bg-black/75' },
    // Every other tone resolves through the shared `Tones.glass` palette (`bg-{tone}/30 text-{tone}-foreground`)
    // so `tone="success"` etc. AND per-instance `color` overrides actually apply, plus a tone-matched hover/active wash.
    { variant: ['glass', 'glass-surface'], tone: 'primary', class: `${Tones.glass.primary} hover:bg-primary/45 active:bg-primary/55` },
    { variant: ['glass', 'glass-surface'], tone: 'danger',  class: `${Tones.glass.danger} hover:bg-destructive/45 active:bg-destructive/55` },
    { variant: ['glass', 'glass-surface'], tone: 'success', class: `${Tones.glass.success} hover:bg-success/45 active:bg-success/55` },
    { variant: ['glass', 'glass-surface'], tone: 'warning', class: `${Tones.glass.warning} hover:bg-warning/45 active:bg-warning/55` },
    // glass-surface non-neutral tones swap the white hairline for a tone-accent border (50% alpha).
    { variant: 'glass-surface', tone: 'primary', class: 'border-primary/50' },
    { variant: 'glass-surface', tone: 'danger',  class: 'border-destructive/50' },
    { variant: 'glass-surface', tone: 'success', class: 'border-success/50' },
    { variant: 'glass-surface', tone: 'warning', class: 'border-warning/50' },
  ],
  defaultVariants: {
    variant: 'solid',
    tone: 'primary',
    size: 'md',
    shape: 'default',
    fullWidth: false,
    wrap: false,
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
