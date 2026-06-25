// Shared visual primitives for form atoms. Co-located in `forms/` so imports
// stay within-domain (ESLint boundaries allow same-domain imports).

import { tv, type VariantProps } from '../utils';

export const inputBaseVariants = tv({
  base: 'flex w-full rounded-md bg-popover text-foreground placeholder:text-subtle-foreground transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-muted',
  variants: {
    size: {
      xs: 'h-7 px-2 text-xs',
      sm: 'h-8 px-2.5 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    state: {
      default: 'border-input hover:border-border-strong',
      invalid: 'border-destructive focus-visible:ring-destructive',
    },
    /* Border weight — scale like `size`/`radius`; default `sm` (1px). Set a literal via `className="border-[1.5px]"`. */
    border: {
      none: 'border-0',
      xs: 'border-[0.5px]',
      sm: 'border',
      md: 'border-2',
      lg: 'border-4',
      xl: 'border-8',
    },
    /* Focus-ring weight — default `md` (2px). The ring being wider than the border read as "thick"; use `sm` for a hairline focus. */
    ring: {
      none: 'focus-visible:ring-0',
      sm: 'focus-visible:ring-1',
      md: 'focus-visible:ring-2',
      lg: 'focus-visible:ring-4',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
    border: 'sm',
    ring: 'md',
  },
});

export type InputBaseVariants = VariantProps<typeof inputBaseVariants>;
