import { tv, type VariantProps } from '../../utils';

export const selectTriggerVariants = tv({
  base: 'flex w-full items-center justify-between gap-2 rounded-md border bg-background text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 data-[state=open]:border-border-strong',
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

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;
