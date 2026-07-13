import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the band-height of a `Navbar`. */
export const NavbarHeight = {
  /** Refers to a compact bar. */
  Sm: 'sm',
  /** Refers to the default bar height. */
  Md: 'md',
  /** Refers to a tall bar. */
  Lg: 'lg',
} as const;

export type NavbarHeight = (typeof NavbarHeight)[keyof typeof NavbarHeight];

/** Provides the header-band chrome (height, sticky positioning) for `Navbar`. */
export const navbarVariants = tv({
  base: 'w-full',
  variants: {
    /* Sticks the band to the top of the scroll container when true. */
    sticky: {
      true: 'sticky top-0 z-sticky',
      false: '',
    },
    /* Band height — the bar's vertical size. */
    height: {
      sm: 'h-12',
      md: 'h-14',
      lg: 'h-16',
    },
  },
  defaultVariants: {
    sticky: false,
    height: 'md',
  },
});

export type NavbarVariants = VariantProps<typeof navbarVariants>;

/* Compile-time lock: enum values ≡ tv `height` keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertNavbarHeight: AssertExact<
  NavbarHeight,
  NonNullable<VariantProps<typeof navbarVariants>['height']>
> = true;
void _assertNavbarHeight;
