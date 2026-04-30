import { tv, type VariantProps } from '../../utils';

export const gridVariants = tv({
  base: 'grid',
  variants: {
    columns: {
      '1': 'grid-cols-1',
      '2': 'grid-cols-2',
      '3': 'grid-cols-3',
      '4': 'grid-cols-4',
      '5': 'grid-cols-5',
      '6': 'grid-cols-6',
      '8': 'grid-cols-8',
      '12': 'grid-cols-12',
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
  },
  defaultVariants: {
    columns: '2',
    gap: '4',
  },
});

export type GridVariants = VariantProps<typeof gridVariants>;
