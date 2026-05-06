import { forwardRef } from 'react';
import { cn } from '../../utils';
import { ToggleButtonGroup, type ToggleButtonGroupProps } from '../toggleButtonGroup/ToggleButtonGroup';

export type SegmentedControlProps = ToggleButtonGroupProps;

/** Visual variant of ToggleButtonGroup — iOS-style connected pill row. */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  ({ className, ...props }, ref) => (
    <ToggleButtonGroup
      ref={ref}
      attached
      className={cn(
        'rounded-md bg-muted p-1',
        '[&>*]:!rounded-md [&>*]:!ml-0 [&>*]:border-transparent [&>*]:bg-transparent',
        '[&>*[data-state=on]]:!bg-background [&>*[data-state=on]]:!text-foreground [&>*[data-state=on]]:shadow-sm',
        className,
      )}
      {...(props as ToggleButtonGroupProps)}
    />
  ),
);
SegmentedControl.displayName = 'SegmentedControl';
