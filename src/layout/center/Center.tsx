import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export type CenterProps = ComponentPropsWithoutRef<'div'>;

/** Flex shorthand that centers its children both axes. */
export const Center = forwardRef<HTMLDivElement, CenterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-center', className)}
      {...props}
    />
  ),
);
Center.displayName = 'Center';
