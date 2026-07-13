import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the max-width preset of a `Container`. */
export const ContainerSize = {
  /** Refers to the small screen max-width. */
  Sm: 'sm',
  /** Refers to the medium screen max-width. */
  Md: 'md',
  /** Refers to the large screen max-width. */
  Lg: 'lg',
  /** Refers to the extra-large screen max-width. */
  Xl: 'xl',
  /** Refers to the 2x extra-large screen max-width. */
  Xxl: '2xl',
  /** Refers to an unconstrained (full) max-width. */
  Full: 'full',
} as const;

export type ContainerSize = (typeof ContainerSize)[keyof typeof ContainerSize];

export const containerVariants = tv({
  base: 'mx-auto w-full px-4',
  variants: {
    size: {
      sm: 'max-w-screen-sm',
      md: 'max-w-screen-md',
      lg: 'max-w-screen-lg',
      xl: 'max-w-screen-xl',
      '2xl': 'max-w-screen-2xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    size: 'lg',
  },
});

export type ContainerVariants = VariantProps<typeof containerVariants>;

/* Compile-time lock: enum values ≡ tv variant keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertContainerSize: AssertExact<
  ContainerSize,
  NonNullable<VariantProps<typeof containerVariants>['size']>
> = true;
void _assertContainerSize;
