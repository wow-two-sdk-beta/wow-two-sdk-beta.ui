import { tv, type VariantProps } from '../../utils';

export const iconButtonVariants = tv({
  base: 'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      solid: 'bg-brand-600 text-white hover:bg-brand-700',
      soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
      outline: 'border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50',
      ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100',
      danger: 'bg-danger-600 text-white hover:bg-danger-700',
    },
    size: {
      xs: 'h-6 w-6 rounded-sm',
      sm: 'h-8 w-8 rounded-md',
      md: 'h-10 w-10 rounded-md',
      lg: 'h-12 w-12 rounded-lg',
    },
    shape: {
      square: '',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    variant: 'ghost',
    size: 'md',
    shape: 'square',
  },
});

export type IconButtonVariants = VariantProps<typeof iconButtonVariants>;
