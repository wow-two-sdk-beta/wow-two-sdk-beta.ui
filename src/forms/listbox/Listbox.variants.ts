import { tv, type VariantProps } from '../../utils';

export const listboxVariants = tv({
  base: 'flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none',
});

export const listboxItemVariants = tv({
  base: 'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none',
  variants: {
    state: {
      default: 'text-popover-foreground',
      active: 'bg-muted text-foreground',
      selected: 'bg-primary-soft text-primary-soft-foreground',
      disabled: 'pointer-events-none opacity-50',
    },
  },
  defaultVariants: { state: 'default' },
});

export const listboxGroupLabelVariants = tv({
  base: 'px-2 py-1.5 text-xs font-semibold text-muted-foreground',
});

export const listboxSeparatorVariants = tv({
  base: '-mx-1 my-1 h-px bg-border',
});

export const listboxEmptyVariants = tv({
  base: 'px-2 py-6 text-center text-sm text-muted-foreground',
});

export type ListboxVariants = VariantProps<typeof listboxVariants>;
export type ListboxItemVariants = VariantProps<typeof listboxItemVariants>;
