import { tv, type VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-brand-600 text-white hover:bg-brand-700',
      secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-100',
      ghost: 'bg-transparent text-neutral-900 hover:bg-neutral-100',
    },
    size: {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;
