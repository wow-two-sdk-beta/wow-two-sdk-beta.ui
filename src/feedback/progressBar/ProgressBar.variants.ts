import { tv, type VariantProps } from '../../utils';

export const progressTrackVariants = tv({
  base: 'h-2 w-full overflow-hidden rounded-full bg-muted',
  variants: {
    size: {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export const progressFillVariants = tv({
  base: 'h-full rounded-full transition-[width] duration-300',
  variants: {
    tone: {
      brand: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-destructive',
      neutral: 'bg-muted-foreground',
    },
  },
  defaultVariants: {
    tone: 'brand',
  },
});

export type ProgressBarVariants = VariantProps<typeof progressTrackVariants> &
  VariantProps<typeof progressFillVariants>;
