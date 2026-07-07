import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the flex main-axis direction of a `Stack`. */
export const StackDirection = {
  /** Refers to a left-to-right row. */
  Row: 'row',
  /** Refers to a top-to-bottom column. */
  Column: 'column',
  /** Refers to a right-to-left row. */
  RowReverse: 'row-reverse',
  /** Refers to a bottom-to-top column. */
  ColumnReverse: 'column-reverse',
} as const;

export type StackDirection = (typeof StackDirection)[keyof typeof StackDirection];

/** Defines the cross-axis alignment of `Stack` children. */
export const StackAlign = {
  /** Refers to alignment at the cross-axis start. */
  Start: 'start',
  /** Refers to centered cross-axis alignment. */
  Center: 'center',
  /** Refers to alignment at the cross-axis end. */
  End: 'end',
  /** Refers to stretching children to fill the cross axis. */
  Stretch: 'stretch',
  /** Refers to baseline alignment of children. */
  Baseline: 'baseline',
} as const;

export type StackAlign = (typeof StackAlign)[keyof typeof StackAlign];

/** Defines the main-axis distribution of `Stack` children. */
export const StackJustify = {
  /** Refers to packing children at the main-axis start. */
  Start: 'start',
  /** Refers to centering children on the main axis. */
  Center: 'center',
  /** Refers to packing children at the main-axis end. */
  End: 'end',
  /** Refers to equal space between children. */
  Between: 'between',
  /** Refers to equal space around each child. */
  Around: 'around',
  /** Refers to equal space between and around children. */
  Evenly: 'evenly',
} as const;

export type StackJustify = (typeof StackJustify)[keyof typeof StackJustify];

/** Defines how `Stack` children wrap onto multiple lines. */
export const StackWrap = {
  /** Refers to wrapping children onto new lines. */
  Wrap: 'wrap',
  /** Refers to keeping children on a single line. */
  Nowrap: 'nowrap',
  /** Refers to wrapping children onto new lines in reverse order. */
  WrapReverse: 'wrap-reverse',
} as const;

export type StackWrap = (typeof StackWrap)[keyof typeof StackWrap];

export const stackVariants = tv({
  base: 'flex',
  variants: {
    direction: {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
    gap: {
      '0': 'gap-0',
      '1': 'gap-1',
      '2': 'gap-2',
      '3': 'gap-3',
      '4': 'gap-4',
      '5': 'gap-5',
      '6': 'gap-6',
      '8': 'gap-8',
      '10': 'gap-10',
      '12': 'gap-12',
    },
    wrap: {
      wrap: 'flex-wrap',
      nowrap: 'flex-nowrap',
      'wrap-reverse': 'flex-wrap-reverse',
    },
  },
  defaultVariants: {
    direction: 'column',
    gap: '4',
  },
});

export type StackVariants = VariantProps<typeof stackVariants>;

/* Compile-time lock: enum values ≡ tv variant keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertStackDirection: AssertExact<
  StackDirection,
  NonNullable<VariantProps<typeof stackVariants>['direction']>
> = true;
const _assertStackAlign: AssertExact<
  StackAlign,
  NonNullable<VariantProps<typeof stackVariants>['align']>
> = true;
const _assertStackJustify: AssertExact<
  StackJustify,
  NonNullable<VariantProps<typeof stackVariants>['justify']>
> = true;
const _assertStackWrap: AssertExact<
  StackWrap,
  NonNullable<VariantProps<typeof stackVariants>['wrap']>
> = true;
void _assertStackDirection;
void _assertStackAlign;
void _assertStackJustify;
void _assertStackWrap;
