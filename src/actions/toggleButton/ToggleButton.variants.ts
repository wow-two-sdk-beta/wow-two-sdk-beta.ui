import { tv, type VariantProps } from '../../utils';

/* Variant × tone matrix for ToggleButton's press-state appearance. Applied on top of Button (variant='ghost' tone='neutral' baseline). Press state is keyed off `data-pressed="true"` — distinct from Button's `data-state` (loading/skeleton/disabled). */
export const toggleButtonVariants = tv({
  base: '',
  variants: {
    variant: {
      ghost: '',
      soft: '',
      outline: 'border',
      solid: 'border',
      glass: 'border border-transparent backdrop-blur-md',
      'glass-surface': 'border backdrop-blur-md',
    },
    tone: {
      primary: '',
      neutral: '',
      danger: '',
      success: '',
      warning: '',
    },
  },
  compoundVariants: [
    // === GHOST × tone — text color only, transparent bg ===
    { variant: 'ghost', tone: 'primary', class: 'text-foreground/50 data-[pressed=true]:text-primary' },
    { variant: 'ghost', tone: 'neutral', class: 'text-foreground/50 data-[pressed=true]:text-foreground' },
    { variant: 'ghost', tone: 'danger',  class: 'text-foreground/50 data-[pressed=true]:text-destructive' },
    { variant: 'ghost', tone: 'success', class: 'text-foreground/50 data-[pressed=true]:text-success' },
    { variant: 'ghost', tone: 'warning', class: 'text-foreground/50 data-[pressed=true]:text-warning' },

    // === SOFT × tone — pressed gets tone-soft bg ===
    { variant: 'soft', tone: 'primary', class: 'text-foreground/70 data-[pressed=true]:bg-primary-soft data-[pressed=true]:text-primary-soft-foreground' },
    { variant: 'soft', tone: 'neutral', class: 'text-foreground/70 data-[pressed=true]:bg-muted data-[pressed=true]:text-foreground' },
    { variant: 'soft', tone: 'danger',  class: 'text-foreground/70 data-[pressed=true]:bg-destructive-soft data-[pressed=true]:text-destructive-soft-foreground' },
    { variant: 'soft', tone: 'success', class: 'text-foreground/70 data-[pressed=true]:bg-success-soft data-[pressed=true]:text-success-soft-foreground' },
    { variant: 'soft', tone: 'warning', class: 'text-foreground/70 data-[pressed=true]:bg-warning-soft data-[pressed=true]:text-warning-soft-foreground' },

    // === OUTLINE × tone — pressed swaps to tone border + tone text ===
    { variant: 'outline', tone: 'primary', class: 'border-input text-foreground/70 data-[pressed=true]:border-primary data-[pressed=true]:text-primary' },
    { variant: 'outline', tone: 'neutral', class: 'border-input text-foreground/70 data-[pressed=true]:border-foreground data-[pressed=true]:text-foreground' },
    { variant: 'outline', tone: 'danger',  class: 'border-input text-foreground/70 data-[pressed=true]:border-destructive data-[pressed=true]:text-destructive' },
    { variant: 'outline', tone: 'success', class: 'border-input text-foreground/70 data-[pressed=true]:border-success data-[pressed=true]:text-success' },
    { variant: 'outline', tone: 'warning', class: 'border-input text-foreground/70 data-[pressed=true]:border-warning data-[pressed=true]:text-warning' },

    // === SOLID × tone — pressed fills with tone ===
    { variant: 'solid', tone: 'primary', class: 'border-input bg-background text-foreground/70 data-[pressed=true]:bg-primary data-[pressed=true]:border-primary data-[pressed=true]:text-primary-foreground' },
    { variant: 'solid', tone: 'neutral', class: 'border-input bg-background text-foreground/70 data-[pressed=true]:bg-foreground data-[pressed=true]:border-foreground data-[pressed=true]:text-background' },
    { variant: 'solid', tone: 'danger',  class: 'border-input bg-background text-foreground/70 data-[pressed=true]:bg-destructive data-[pressed=true]:border-destructive data-[pressed=true]:text-destructive-foreground' },
    { variant: 'solid', tone: 'success', class: 'border-input bg-background text-foreground/70 data-[pressed=true]:bg-success data-[pressed=true]:border-success data-[pressed=true]:text-success-foreground' },
    { variant: 'solid', tone: 'warning', class: 'border-input bg-background text-foreground/70 data-[pressed=true]:bg-warning data-[pressed=true]:border-warning data-[pressed=true]:text-warning-foreground' },

    // === GLASS × tone — dark glass; pressed darkens slightly + tone-tinted text on tone variants ===
    { variant: 'glass', tone: 'primary', class: 'bg-black/45 text-white/60 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-white' },
    { variant: 'glass', tone: 'neutral', class: 'bg-black/45 text-white/60 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-white' },
    { variant: 'glass', tone: 'danger',  class: 'bg-black/45 text-white/60 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-destructive' },
    { variant: 'glass', tone: 'success', class: 'bg-black/45 text-white/60 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-success' },
    { variant: 'glass', tone: 'warning', class: 'bg-black/45 text-white/60 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-warning' },

    // === GLASS-SURFACE × tone — same as glass + visible border emphasis on press ===
    { variant: 'glass-surface', tone: 'primary', class: 'bg-black/45 text-white/60 border-white/10 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-white data-[pressed=true]:border-white/40' },
    { variant: 'glass-surface', tone: 'neutral', class: 'bg-black/45 text-white/60 border-white/10 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-white data-[pressed=true]:border-white/40' },
    { variant: 'glass-surface', tone: 'danger',  class: 'bg-black/45 text-white/60 border-white/10 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-destructive data-[pressed=true]:border-destructive/60' },
    { variant: 'glass-surface', tone: 'success', class: 'bg-black/45 text-white/60 border-white/10 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-success data-[pressed=true]:border-success/60' },
    { variant: 'glass-surface', tone: 'warning', class: 'bg-black/45 text-white/60 border-white/10 data-[pressed=true]:bg-black/65 data-[pressed=true]:text-warning data-[pressed=true]:border-warning/60' },
  ],
  defaultVariants: {
    variant: 'ghost',
    tone: 'primary',
  },
});

export type ToggleButtonVariants = VariantProps<typeof toggleButtonVariants>;
