import { tv, type VariantProps } from '../../utils';

export const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full font-medium',
  variants: {
    variant: {
      neutral: 'bg-muted text-foreground',
      brand: 'bg-primary-soft text-primary-soft-foreground',
      success: 'bg-success-soft text-success-soft-foreground',
      warning: 'bg-warning-soft text-warning-soft-foreground',
      danger: 'bg-destructive-soft text-destructive-soft-foreground',
      info: 'bg-info-soft text-info-soft-foreground',
      outline: 'border border-border text-foreground',
    },
    size: {
      sm: 'h-5 px-2 text-xs',
      md: 'h-6 px-2.5 text-xs',
      lg: 'h-7 px-3 text-sm',
    },
  },
  defaultVariants: {
    variant: 'neutral',
    size: 'md',
  },
});

export type BadgeVariants = VariantProps<typeof badgeVariants>;
