import { tv, type VariantProps } from '../../utils';

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

/** Represents the band-height axis of the `Navbar` (`sm` · `md` · `lg`). */
export type NavbarHeight = NonNullable<NavbarVariants['height']>;
