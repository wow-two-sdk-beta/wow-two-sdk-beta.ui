import { tv, type VariantProps } from '../../utils';

export const toastSimpleVariants = tv({
  base: 'pointer-events-auto rounded-md border bg-popover text-popover-foreground shadow-lg px-4 py-3 text-sm',
  variants: {
    severity: {
      info: 'border-info-soft',
      success: 'border-success-soft',
      warning: 'border-warning-soft',
      danger: 'border-destructive-soft',
      neutral: 'border-border',
    },
  },
  defaultVariants: {
    severity: 'neutral',
  },
});

export type ToastSimpleVariants = VariantProps<typeof toastSimpleVariants>;
