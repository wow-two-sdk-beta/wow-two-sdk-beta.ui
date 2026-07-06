import { tv, type VariantProps } from '../../../foundation/utils';

/**
 * Provides the layout for `ControlGroup` across three slots — the `root`
 * arrangement, the muted `label`, and the `content` slot holding the control(s) —
 * keyed by `orientation` and whether adjacent groups are `divided`.
 */
export const controlGroupVariants = tv({
  slots: {
    root: 'py-2 first:pt-0',
    label: 'text-sm text-muted-foreground',
    content: 'flex items-center gap-2',
  },
  variants: {
    orientation: {
      /* Label beside the control(s) — the settings-row look. */
      horizontal: {
        root: 'flex min-h-10 items-center justify-between gap-4',
      },
      /* Label stacked above the control(s) — for wide controls. */
      vertical: {
        root: 'flex flex-col gap-1.5',
        content: 'flex-wrap',
      },
    },
    /* Hairline between adjacent groups (semantic `border` token), skipped on the last. */
    divided: {
      true: { root: '[&:not(:last-child)]:border-b [&:not(:last-child)]:border-border' },
      false: {},
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    divided: true,
  },
});

export type ControlGroupVariants = VariantProps<typeof controlGroupVariants>;

/** Represents the label-to-control arrangement of a `ControlGroup` (`horizontal` · `vertical`). */
export type ControlGroupOrientation = NonNullable<ControlGroupVariants['orientation']>;
