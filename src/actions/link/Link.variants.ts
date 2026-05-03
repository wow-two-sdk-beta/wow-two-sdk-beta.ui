import { tv, type VariantProps } from '../../utils';

export const linkVariants = tv({
  base: 'inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
  variants: {
    variant: {
      default: 'text-primary hover:text-primary/85 hover:underline',
      subtle: 'text-foreground hover:underline',
      muted: 'text-muted-foreground hover:text-foreground hover:underline',
      inherit: 'text-current underline-offset-2 hover:underline',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export type LinkVariants = VariantProps<typeof linkVariants>;
