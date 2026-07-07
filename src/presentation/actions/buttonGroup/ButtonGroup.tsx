import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, Orientation } from '../../../foundation/utils';

export interface ButtonGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** The visual orientation. Default `horizontal`. */
  orientation?: Orientation;

  /** The attached state — groups children with collapsed inner radii (connected look). Default `true`. */
  isAttached?: boolean;
}

/** Visually groups action-children — collapses inner radii when `isAttached`. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = Orientation.Horizontal, isAttached = true, className, ...props }, ref) => {
    const isHorizontal = orientation === Orientation.Horizontal;
    return (
      <div
        ref={ref}
        role="group"
        data-orientation={orientation}
        className={cn(
          'inline-flex',
          isHorizontal ? 'flex-row' : 'flex-col',
          isAttached
            ? isHorizontal
              ? '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child)]:-ml-px'
              : '[&>*]:rounded-none [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:not(:first-child)]:-mt-px'
            : 'gap-2',
          className,
        )}
        {...props}
      />
    );
  },
);
ButtonGroup.displayName = 'ButtonGroup';
