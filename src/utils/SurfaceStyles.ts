/* Provides the cross-domain surface style engine — variant × tone × radius × padding × elevation. */

import { tv, type VariantProps } from './tv';

/** Provides the tailwind-variants config for every "block with a visual treatment" surface. */
export const surfaceVariants = tv({
  base: 'outline-none transition-colors',
  variants: {
    variant: {
      /* Opaque fill, no border, light shadow. Tooltips, chips, inline pills. */
      solid: 'shadow-sm',
      /* Muted/tinted fill, no border, light shadow. Chat bubbles, inline groups. */
      soft: 'shadow-sm',
      /* Opaque fill + visible border + medium shadow. Default for popovers/menus. */
      surface: 'border shadow-md',
      /* Transparent fill + visible border. Static cards, embedded info blocks. */
      outline: 'border bg-transparent',
      /* Translucent + blur, no border, medium shadow. Image overlays. */
      glass: 'backdrop-blur-md shadow-md',
      /* Translucent + blur + subtle border. Premium / hero overlays. */
      'glass-outline': 'border backdrop-blur-md shadow-md',
      /* Opaque fill, no border, heavy shadow. Modals, drawers, command palette. */
      elevated: 'shadow-xl',
      /* Opaque fill, no border, no shadow. Embedded sub-panels inside another surface. */
      flat: '',
    },

    tone: {
      neutral: '',
      primary: '',
      danger: '',
      success: '',
      warning: '',
      info: '',
    },

    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    },

    padding: {
      none: 'p-0',
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4',
      xl: 'p-6',
      '2xl': 'p-8',
    },

    /* Optional shadow override — when set, beats variant's default shadow via
       tailwind-merge precedence. Leave undefined to inherit from variant. */
    elevation: {
      0: 'shadow-none',
      1: 'shadow-sm',
      2: 'shadow-md',
      3: 'shadow-lg',
      4: 'shadow-xl',
      5: 'shadow-2xl',
    },
  },

  compoundVariants: [
    /* SOLID + ELEVATED + FLAT — opaque, tone bg, tone foreground. Same color matrix
       across these three variants — shadow is the only diff (handled by variant base). */
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'neutral',
      class: 'bg-popover text-popover-foreground',
    },
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'primary',
      class: 'bg-primary text-primary-foreground',
    },
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'danger',
      class: 'bg-destructive text-destructive-foreground',
    },
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'success',
      class: 'bg-success text-success-foreground',
    },
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'warning',
      class: 'bg-warning text-warning-foreground',
    },
    {
      variant: ['solid', 'elevated', 'flat'],
      tone: 'info',
      class: 'bg-info text-info-foreground',
    },

    /* SOFT — muted/tinted bg, tone-readable text. */
    { variant: 'soft', tone: 'neutral', class: 'bg-muted text-foreground' },
    { variant: 'soft', tone: 'primary', class: 'bg-primary-soft text-primary' },
    { variant: 'soft', tone: 'danger', class: 'bg-destructive-soft text-destructive' },
    { variant: 'soft', tone: 'success', class: 'bg-success-soft text-success' },
    { variant: 'soft', tone: 'warning', class: 'bg-warning-soft text-warning' },
    { variant: 'soft', tone: 'info', class: 'bg-info-soft text-info' },

    /* SURFACE — popover bg + tone-accent border. Border colours subtly to keep
       the panel reading as "neutral surface with [tone] context". */
    {
      variant: 'surface',
      tone: 'neutral',
      class: 'border-border bg-popover text-popover-foreground',
    },
    {
      variant: 'surface',
      tone: 'primary',
      class: 'border-primary/40 bg-popover text-popover-foreground',
    },
    {
      variant: 'surface',
      tone: 'danger',
      class: 'border-destructive/40 bg-popover text-popover-foreground',
    },
    {
      variant: 'surface',
      tone: 'success',
      class: 'border-success/40 bg-popover text-popover-foreground',
    },
    {
      variant: 'surface',
      tone: 'warning',
      class: 'border-warning/40 bg-popover text-popover-foreground',
    },
    {
      variant: 'surface',
      tone: 'info',
      class: 'border-info/40 bg-popover text-popover-foreground',
    },

    /* OUTLINE — fully transparent fill, tone border + tone-readable text. */
    { variant: 'outline', tone: 'neutral', class: 'border-border text-foreground' },
    { variant: 'outline', tone: 'primary', class: 'border-primary text-primary' },
    { variant: 'outline', tone: 'danger', class: 'border-destructive text-destructive' },
    { variant: 'outline', tone: 'success', class: 'border-success text-success' },
    { variant: 'outline', tone: 'warning', class: 'border-warning text-warning' },
    { variant: 'outline', tone: 'info', class: 'border-info text-info' },

    /* GLASS — translucent tinted fill + blur. Tone fills with alpha; foreground
       must read clearly across the blurred background underneath. */
    {
      variant: 'glass',
      tone: 'neutral',
      class: 'bg-popover/70 text-popover-foreground',
    },
    {
      variant: 'glass',
      tone: 'primary',
      class: 'bg-primary/30 text-primary-foreground',
    },
    {
      variant: 'glass',
      tone: 'danger',
      class: 'bg-destructive/30 text-destructive-foreground',
    },
    {
      variant: 'glass',
      tone: 'success',
      class: 'bg-success/30 text-success-foreground',
    },
    {
      variant: 'glass',
      tone: 'warning',
      class: 'bg-warning/30 text-warning-foreground',
    },
    {
      variant: 'glass',
      tone: 'info',
      class: 'bg-info/30 text-info-foreground',
    },

    /* GLASS-OUTLINE — glass + tone-accent border at 50% alpha. */
    {
      variant: 'glass-outline',
      tone: 'neutral',
      class: 'border-border/50 bg-popover/70 text-popover-foreground',
    },
    {
      variant: 'glass-outline',
      tone: 'primary',
      class: 'border-primary/50 bg-primary/30 text-primary-foreground',
    },
    {
      variant: 'glass-outline',
      tone: 'danger',
      class: 'border-destructive/50 bg-destructive/30 text-destructive-foreground',
    },
    {
      variant: 'glass-outline',
      tone: 'success',
      class: 'border-success/50 bg-success/30 text-success-foreground',
    },
    {
      variant: 'glass-outline',
      tone: 'warning',
      class: 'border-warning/50 bg-warning/30 text-warning-foreground',
    },
    {
      variant: 'glass-outline',
      tone: 'info',
      class: 'border-info/50 bg-info/30 text-info-foreground',
    },
  ],

  defaultVariants: {
    variant: 'surface',
    tone: 'neutral',
    radius: 'md',
    padding: 'none',
  },
});

/** Represents the union of every surface variant prop. */
export type SurfaceVariants = VariantProps<typeof surfaceVariants>;

/** Represents the visual-recipe axis (solid · soft · surface · outline · glass · etc.). */
export type SurfaceVariant = NonNullable<SurfaceVariants['variant']>;

/** Represents the semantic colour axis (neutral · primary · danger · success · warning · info). */
export type SurfaceTone = NonNullable<SurfaceVariants['tone']>;

/** Represents the corner-roundness axis (none · sm · md · lg · xl · 2xl · full). */
export type SurfaceRadius = NonNullable<SurfaceVariants['radius']>;

/** Represents the interior-padding axis (none · xs · sm · md · lg · xl · 2xl). */
export type SurfacePadding = NonNullable<SurfaceVariants['padding']>;

/** Represents the shadow-depth override (0–5); when omitted the variant decides. */
export type SurfaceElevation = NonNullable<SurfaceVariants['elevation']>;
