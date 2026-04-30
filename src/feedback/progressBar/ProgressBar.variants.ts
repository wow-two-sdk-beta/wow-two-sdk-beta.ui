import { tv, type VariantProps } from '../../utils';

export const progressTrackVariants = tv({
  base: 'h-2 w-full overflow-hidden rounded-full bg-neutral-200',
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
      brand: 'bg-brand-600',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      neutral: 'bg-neutral-500',
    },
  },
  defaultVariants: {
    tone: 'brand',
  },
});

export type ProgressBarVariants = VariantProps<typeof progressTrackVariants> &
  VariantProps<typeof progressFillVariants>;
