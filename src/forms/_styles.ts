// Shared visual primitives for form atoms. Co-located in `forms/` so imports
// stay within-domain (ESLint boundaries allow same-domain imports).

import { tv, type VariantProps } from '../utils';

export const inputBaseVariants = tv({
  base: 'flex w-full rounded-md border bg-background text-foreground placeholder:text-subtle-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-muted',
  variants: {
    size: {
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    state: {
      default: 'border-input hover:border-border-strong',
      invalid: 'border-destructive focus-visible:ring-destructive',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

export type InputBaseVariants = VariantProps<typeof inputBaseVariants>;
