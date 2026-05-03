import { tv, type VariantProps } from '../../utils';

export const fabVariants = tv({
  base: 'fixed inline-flex items-center justify-center rounded-full shadow-lg transition-all hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      secondary: 'bg-card text-card-foreground border border-border hover:bg-muted',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    },
    size: {
      sm: 'h-10 w-10',
      md: 'h-14 w-14',
      lg: 'h-16 w-16',
    },
    position: {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    position: 'bottom-right',
  },
});

export type FABVariants = VariantProps<typeof fabVariants>;
