import { tv, type VariantProps } from '../../utils';

export const linkVariants = tv({
  base: 'inline-flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-sm',
  variants: {
    variant: {
      default: 'text-brand-600 hover:text-brand-700 hover:underline',
      subtle: 'text-neutral-700 hover:text-neutral-900 hover:underline',
      muted: 'text-neutral-500 hover:text-neutral-700 hover:underline',
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
