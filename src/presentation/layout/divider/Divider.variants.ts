import { tv, type VariantProps, Orientation } from '../../../foundation/utils';

/**
 * Provides the rule geometry for `Divider`. A horizontal divider is a full-width
 * top border; a vertical divider is a full-height left border that stretches to
 * its flex/grid parent. The line color is the semantic `border` token.
 */
export const dividerVariants = tv({
  base: 'border-border',
  variants: {
    orientation: {
      horizontal: 'w-full border-t',
      vertical: 'h-full self-stretch border-l',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

export type DividerVariants = VariantProps<typeof dividerVariants>;

/* Compile-time lock: shared `Orientation` values ≡ tv `orientation` keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertDividerOrientation: AssertExact<
  Orientation,
  NonNullable<VariantProps<typeof dividerVariants>['orientation']>
> = true;
void _assertDividerOrientation;

/** Represents the axis of a `Divider` — the shared {@link Orientation} vocabulary. */
export type DividerOrientation = Orientation;
