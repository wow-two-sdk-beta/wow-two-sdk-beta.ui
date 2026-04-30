import { tv, type VariantProps } from '../../utils';

export const toastSimpleVariants = tv({
  base: 'pointer-events-auto rounded-md border bg-white shadow-lg px-4 py-3 text-sm',
  variants: {
    severity: {
      info: 'border-info-100',
      success: 'border-success-100',
      warning: 'border-warning-100',
      danger: 'border-danger-100',
      neutral: 'border-neutral-200',
    },
  },
  defaultVariants: {
    severity: 'neutral',
  },
});

export type ToastSimpleVariants = VariantProps<typeof toastSimpleVariants>;
