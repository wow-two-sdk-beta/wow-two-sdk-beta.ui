import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface InputGroupProps extends ComponentPropsWithoutRef<'div'> {
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Visually joins a row/column of inputs (TextInput, NumberInput, etc.)
 * — collapses inner radii so they read as one connected control. Mirror
 * of `actions/ButtonGroup`.
 */
export const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>(
  ({ orientation = 'horizontal', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex w-full',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        orientation === 'horizontal'
          ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
          : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px',
        className,
      )}
      {...props}
    />
  ),
);
InputGroup.displayName = 'InputGroup';
