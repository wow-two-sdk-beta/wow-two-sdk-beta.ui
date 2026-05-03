import { tv, type VariantProps } from '../../utils';

export const iconButtonVariants = tv({
  base: 'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      solid: 'bg-primary text-primary-foreground hover:bg-primary/90',
      soft: 'bg-primary-soft text-primary-soft-foreground hover:bg-primary-soft/80',
      outline: 'border border-input bg-background text-foreground hover:bg-muted',
      ghost: 'bg-transparent text-foreground hover:bg-muted',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
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
