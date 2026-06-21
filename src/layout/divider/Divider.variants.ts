import { tv, type VariantProps } from '../../utils';

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

/** Represents the axis of a `Divider` (`horizontal` · `vertical`). */
export type DividerOrientation = NonNullable<DividerVariants['orientation']>;
