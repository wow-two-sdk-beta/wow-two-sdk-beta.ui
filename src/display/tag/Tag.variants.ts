import { tv, type VariantProps } from '../../utils';

export const tagVariants = tv({
  base: 'inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-0.5 text-xs font-medium text-card-foreground',
  variants: {
    variant: {
      neutral: '',
      brand: 'border-transparent bg-primary-soft text-primary-soft-foreground',
      success: 'border-transparent bg-success-soft text-success-soft-foreground',
      warning: 'border-transparent bg-warning-soft text-warning-soft-foreground',
      danger: 'border-transparent bg-destructive-soft text-destructive-soft-foreground',
      info: 'border-transparent bg-info-soft text-info-soft-foreground',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export type TagVariants = VariantProps<typeof tagVariants>;
