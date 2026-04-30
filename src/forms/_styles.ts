// Shared visual primitives for form atoms. Co-located in `forms/` so imports
// stay within-domain (ESLint boundaries allow same-domain imports).

import { tv, type VariantProps } from '../utils';

export const inputBaseVariants = tv({
  base: 'flex w-full rounded-md border bg-white text-neutral-900 placeholder:text-neutral-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-neutral-50',
  variants: {
    size: {
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    state: {
      default: 'border-neutral-300 hover:border-neutral-400',
      invalid: 'border-danger-500 focus-visible:ring-danger-500',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

export type InputBaseVariants = VariantProps<typeof inputBaseVariants>;
