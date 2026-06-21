import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface ButtonGroupProps extends ComponentPropsWithoutRef<'div'> {
  /** Visual orientation. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
  /** Group children with collapsed inner radii (connected look). Default `true`. */
  isAttached?: boolean;
}

/** Visually groups action-children — collapses inner radii when `isAttached`. */
export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ orientation = 'horizontal', isAttached = true, className, ...props }, ref) => (
    <div
      ref={ref}
      role="group"
      data-orientation={orientation}
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        isAttached
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
