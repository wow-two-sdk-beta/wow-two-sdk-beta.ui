import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface ButtonGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Visual orientation. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Group children with collapsed inner radii (connected look). Default `true`. */
  attached?: boolean;
}

/**
 * Visually groups Button / IconButton children. When `attached` (default),
 * collapses inner border-radii so children read as one connected control.
 * Pass `attached={false}` for a simple gap-spaced row.
 */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'horizontal', attached = true, className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      data-orientation={orientation}
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        attached
          ? orientation === 'horizontal'
            ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
            : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
          : 'gap-2',
        className,
      )}
      {...props}
    />
  ),
);
ButtonGroup.displayName = 'ButtonGroup';
