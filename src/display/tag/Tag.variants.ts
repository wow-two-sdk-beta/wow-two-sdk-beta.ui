import { tv, type VariantProps } from '../../utils';

export const tagVariants = tv({
  base: 'inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-neutral-800',
  variants: {
    variant: {
      neutral: '',
      brand: 'border-brand-200 bg-brand-50 text-brand-800',
      success: 'border-success-100 bg-success-50 text-success-700',
      warning: 'border-warning-100 bg-warning-50 text-warning-700',
      danger: 'border-danger-100 bg-danger-50 text-danger-700',
      info: 'border-info-100 bg-info-50 text-info-700',
    },
  },
  defaultVariants: {
    variant: 'neutral',
  },
});

export type TagVariants = VariantProps<typeof tagVariants>;
