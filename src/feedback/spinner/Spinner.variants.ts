import { tv, type VariantProps } from '../../utils';

export const spinnerVariants = tv({
  base: 'inline-block animate-spin rounded-full border-current border-b-transparent',
  variants: {
    size: {
      xs: 'h-3 w-3 border',
      sm: 'h-4 w-4 border-2',
      md: 'h-5 w-5 border-2',
      lg: 'h-8 w-8 border-2',
      xl: 'h-12 w-12 border-[3px]',
    },
    tone: {
      default: 'text-neutral-500',
      brand: 'text-brand-600',
      muted: 'text-neutral-300',
      current: '',
    },
  },
  defaultVariants: {
    size: 'md',
    tone: 'default',
  },
});

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;
