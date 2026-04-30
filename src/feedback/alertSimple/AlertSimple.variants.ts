import { tv, type VariantProps } from '../../utils';

export const alertSimpleVariants = tv({
  base: 'rounded-md border px-4 py-3 text-sm',
  variants: {
    severity: {
      info: 'border-info-100 bg-info-50 text-info-900',
      success: 'border-success-100 bg-success-50 text-success-900',
      warning: 'border-warning-100 bg-warning-50 text-warning-900',
      danger: 'border-danger-100 bg-danger-50 text-danger-900',
      neutral: 'border-neutral-200 bg-neutral-50 text-neutral-900',
    },
  },
  defaultVariants: {
    severity: 'info',
  },
});

export type AlertSimpleVariants = VariantProps<typeof alertSimpleVariants>;
