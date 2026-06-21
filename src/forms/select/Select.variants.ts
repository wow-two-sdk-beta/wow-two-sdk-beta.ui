import { tv, type VariantProps } from '../../utils';
import { inputBaseVariants } from '../InputStyles';

/**
 * Extends the shared `inputBaseVariants` so the trigger's height, border,
 * focus-ring, disabled, and per-size paddings stay in lockstep with `TextInput`.
 * Only trigger-specific extras are added here:
 * - `justify-between` + `gap-2` to push the chevron/clear cluster to the end,
 * - `data-[state=open]:border-border-strong` to mirror the hover border while open.
 */
export const selectTriggerVariants = tv({
  extend: inputBaseVariants,
  base: 'items-center justify-between gap-2 data-[state=open]:border-border-strong',
  variants: {
    size: {
      xs: 'gap-1.5',
      sm: '',
      md: '',
      lg: '',
    },
  },
});

export type SelectTriggerVariants = VariantProps<typeof selectTriggerVariants>;
