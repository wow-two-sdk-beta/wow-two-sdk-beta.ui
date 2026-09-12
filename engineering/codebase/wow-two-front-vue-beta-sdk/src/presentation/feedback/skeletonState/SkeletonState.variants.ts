import { tv, type VariantProps } from '../../../foundation/styles';

/** Defines the SkeletonState placeholder shape. */
export const SkeletonStateShape = {
  /** Refers to a rounded rectangle block. */
  Rect: 'rect',
  /** Refers to a text line (fixed height, small radius). */
  Text: 'text',
  /** Refers to a circle (avatar / icon placeholder). */
  Circle: 'circle',
} as const;

export type SkeletonStateShape = (typeof SkeletonStateShape)[keyof typeof SkeletonStateShape];

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

export type SkeletonStateVariants = VariantProps<typeof skeletonVariants>;

/* Compile-time lock: SkeletonStateShape values ≡ tv shape keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertSkeletonShape: AssertExact<
  SkeletonStateShape,
  NonNullable<VariantProps<typeof skeletonVariants>['shape']>
> = true;
void _assertSkeletonShape;
