import { tv, Align, type VariantProps } from '../../../foundation/utils';

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
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    wrap: false,
    align: 'start',
  },
});

export type OptionTileGroupVariants = VariantProps<typeof optionTileGroupVariants>;

/* Compile-time lock: shared `Align` values ≡ tv `align` keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertOptionTileGroupAlign: AssertExact<
  Align,
  NonNullable<OptionTileGroupVariants['align']>
> = true;
void _assertOptionTileGroupAlign;
