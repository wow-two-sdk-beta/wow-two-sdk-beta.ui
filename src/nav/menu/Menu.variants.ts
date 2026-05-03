import { tv, type VariantProps } from '../../utils';

export const menuVariants = tv({
  base: 'flex min-w-[8rem] flex-col gap-0.5 rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md outline-none',
});

export const menuItemVariants = tv({
  base: 'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors focus:bg-muted focus:text-foreground hover:bg-muted hover:text-foreground',
  variants: {
    state: {
      default: 'text-popover-foreground',
      destructive: 'text-destructive focus:bg-destructive-soft hover:bg-destructive-soft',
      disabled: 'pointer-events-none opacity-50',
    },
  },
  defaultVariants: { state: 'default' },
});

export const menuLabelVariants = tv({
  base: 'px-2 py-1.5 text-xs font-semibold text-muted-foreground',
});

export const menuSeparatorVariants = tv({
  base: '-mx-1 my-1 h-px bg-border',
});

export type MenuVariants = VariantProps<typeof menuVariants>;
export type MenuItemVariants = VariantProps<typeof menuItemVariants>;
