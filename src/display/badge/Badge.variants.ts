import { tv, type VariantProps } from '../../utils';

export const badgeVariants = tv({
  base: 'inline-flex items-center rounded-full font-medium',
  variants: {
    variant: {
      neutral: 'bg-neutral-100 text-neutral-800',
      brand: 'bg-brand-100 text-brand-800',
      success: 'bg-success-100 text-success-700',
      warning: 'bg-warning-100 text-warning-700',
      danger: 'bg-danger-100 text-danger-700',
      info: 'bg-info-100 text-info-700',
      outline: 'border border-neutral-300 text-neutral-800',
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
