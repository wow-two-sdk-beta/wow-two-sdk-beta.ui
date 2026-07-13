import { tv, type VariantProps } from '../../../foundation/utils';

/** Defines the visual state of a listbox item. */
export const ListboxItemState = {
  /** Refers to the resting item. */
  Default: 'default',
  /** Refers to the active (roving-focused) item. */
  Active: 'active',
  /** Refers to a selected item. */
  Selected: 'selected',
  /** Refers to a disabled item. */
  Disabled: 'disabled',
} as const;

export type ListboxItemState = (typeof ListboxItemState)[keyof typeof ListboxItemState];

/* Listbox container — STRUCTURAL only. Surface chrome (bg, border, shadow,
   rounded, padding) is composed from `surfaceVariants` in `Listbox.tsx`. */
export const listboxVariants = tv({
  base: 'flex max-h-72 flex-col gap-0.5 overflow-y-auto text-sm outline-none',
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

/* Compile-time lock: enum values ≡ tv axis keys (drift = type error). */
type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
const _assertListboxItemState: AssertExact<
  ListboxItemState, NonNullable<VariantProps<typeof listboxItemVariants>['state']>
> = true;
void _assertListboxItemState;
