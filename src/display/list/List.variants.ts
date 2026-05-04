import { tv, type VariantProps } from '../../utils';

export const listVariants = tv({
  base: 'list-outside',
  variants: {
    marker: {
      none: 'list-none pl-0',
      disc: 'list-disc pl-5',
      decimal: 'list-decimal pl-5',
      check: 'list-none pl-0',
    },
    spacing: {
      tight: '[&>li]:py-0.5',
      normal: '[&>li]:py-1',
      loose: '[&>li]:py-2',
    },
  },
  defaultVariants: {
    marker: 'none',
    spacing: 'normal',
  },
});

export const listItemVariants = tv({
  base: 'flex items-start gap-3 text-sm text-foreground',
});

export type ListVariants = VariantProps<typeof listVariants>;
