import { tv, type VariantProps } from '../../utils';

export const toggleButtonVariants = tv({
  base: 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
  variants: {
    variant: {
      solid: 'bg-muted text-foreground hover:bg-muted/80',
      outline: 'border border-input bg-background text-foreground hover:bg-muted',
      ghost: 'bg-transparent text-foreground hover:bg-muted',
    },
    size: {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-sm rounded-md',
      lg: 'h-12 px-6 text-base rounded-lg',
    },
  },
  defaultVariants: {
    variant: 'ghost',
    size: 'md',
  },
});

export type ToggleButtonVariants = VariantProps<typeof toggleButtonVariants>;
