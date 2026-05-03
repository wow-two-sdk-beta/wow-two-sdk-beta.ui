import { tv, type VariantProps } from '../../utils';

export const skeletonVariants = tv({
  base: 'animate-pulse bg-muted',
  variants: {
    shape: {
      rect: 'rounded-md',
      text: 'h-4 rounded-sm',
      circle: 'rounded-full',
    },
  },
  defaultVariants: {
    shape: 'rect',
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
