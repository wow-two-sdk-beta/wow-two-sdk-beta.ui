import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, Orientation } from '../../../foundation/utils';

export interface InputGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** The layout axis. Default `horizontal`. */
  orientation?: Orientation;
}

/**
 * Visually joins a row/column of inputs (TextInput, NumberInput, etc.)
 * — collapses inner radii so they read as one connected control. Mirror
 * of `actions/ButtonGroup`.
 */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ orientation = Orientation.Horizontal, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex w-full',
        orientation === Orientation.Horizontal ? 'flex-row' : 'flex-col',
        orientation === Orientation.Horizontal
          ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
          : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px',
        className,
      )}
      {...props}
    />
  ),
);
InputGroup.displayName = 'InputGroup';
