import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the Link's color treatment. */
export const LinkVariant = {
  /** Refers to the primary-colored link. */
  Default: 'default',
  /** Refers to a foreground-colored, underline-on-hover link. */
  Subtle: 'subtle',
  /** Refers to a muted link that brightens on hover. */
  Muted: 'muted',
  /** Refers to a link that inherits the surrounding text color. */
  Inherit: 'inherit',
} as const;

export type LinkVariant = (typeof LinkVariant)[keyof typeof LinkVariant];

/** Defines the Link's text size. */
export const LinkSize = {
  /** Refers to the small text size. */
  Sm: 'sm',
  /** Refers to the base (default) text size. */
  Md: 'md',
  /** Refers to the large text size. */
  Lg: 'lg',
} as const;

export type LinkSize = (typeof LinkSize)[keyof typeof LinkSize];

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

/* Compile-time lock: enum values ≡ tv axis keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertLinkVariant: AssertExact<LinkVariant, NonNullable<LinkVariants['variant']>> = true;
const _assertLinkSize: AssertExact<LinkSize, NonNullable<LinkVariants['size']>> = true;
void _assertLinkVariant;
void _assertLinkSize;
