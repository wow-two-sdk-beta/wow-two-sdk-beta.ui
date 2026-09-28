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

/** Defines how a skeleton moves while it waits. */
export const SkeletonStateAnimation = {
  /** Refers to a slow opacity pulse — the default. */
  Pulse: 'pulse',
  /** Refers to a light band sweeping across the placeholder. */
  Shimmer: 'shimmer',
  /** Refers to a still placeholder, for dense or reduced-noise surfaces. */
  None: 'none',
} as const;

export type SkeletonStateAnimation = (typeof SkeletonStateAnimation)[keyof typeof SkeletonStateAnimation];

const Animation = {
  pulse: 'animate-pulse motion-reduce:animate-none',
  shimmer:
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-(--animate-shimmer) ' +
    'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ' +
    'dark:before:via-white/10 motion-reduce:before:hidden',
  none: '',
} as const;

export const skeletonVariants = tv({
  base: 'bg-muted',
  variants: {
    shape: {
      rect: 'rounded-md',
      text: 'h-4 rounded-sm',
      circle: 'rounded-full',
    },
    animation: Animation,
  },
  defaultVariants: {
    shape: 'rect',
    animation: 'pulse',
  },
});

export type SkeletonStateVariants = VariantProps<typeof skeletonVariants>;

/** A content-shaped slot takes its size from the content it hides, so its shapes set corners only. */
export const skeletonSlotVariants = tv({
  base: 'pointer-events-none select-none bg-muted text-transparent [&_*]:invisible',
  variants: {
    shape: {
      rect: 'rounded-md',
      text: 'rounded-sm',
      circle: 'rounded-full',
    },
    animation: Animation,
  },
  defaultVariants: {
    shape: 'text',
    animation: 'pulse',
  },
});

/* Compile-time lock: enum values ≡ tv keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertSkeletonShape: AssertExact<
  SkeletonStateShape,
  NonNullable<VariantProps<typeof skeletonVariants>['shape']>
> = true;
const _assertSkeletonAnimation: AssertExact<
  SkeletonStateAnimation,
  NonNullable<VariantProps<typeof skeletonVariants>['animation']>
> = true;
void _assertSkeletonShape;
void _assertSkeletonAnimation;
