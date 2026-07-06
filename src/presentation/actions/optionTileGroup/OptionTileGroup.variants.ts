import { tv, type VariantProps } from '../../../foundation/utils';

/** Provides the tile-row layout for `OptionTileGroup` on top of the reset `Fieldset` — flex row, gap, optional wrap + main-axis alignment. */
export const optionTileGroupVariants = tv({
  base: 'flex items-center gap-2',
  variants: {
    wrap: {
      true: 'flex-wrap',
      false: '',
    },
    align: {
      start: 'justify-start',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    wrap: false,
    align: 'start',
  },
});

export type OptionTileGroupVariants = VariantProps<typeof optionTileGroupVariants>;

/** Represents the main-axis alignment of an `OptionTileGroup` (`start` · `end`). */
export type OptionTileGroupAlign = NonNullable<OptionTileGroupVariants['align']>;
