import { forwardRef } from 'react';
import { ToggleButtonGroup, type ToggleButtonGroupProps } from '../toggleButtonGroup/ToggleButtonGroup';

export type SegmentedControlProps = Omit<ToggleButtonGroupProps, 'variant'>;

/**
 * iOS-style connected pill row.
 *
 * @deprecated Use `ToggleButtonGroup variant="segmented"` — this is now a thin alias that
 * forwards to it. Kept for back-compat; will be removed in a future beta.
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>((props, ref) => (
  <ToggleButtonGroup ref={ref} variant="segmented" {...(props as ToggleButtonGroupProps)} />
));
SegmentedControl.displayName = 'SegmentedControl';
