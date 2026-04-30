import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';
import { skeletonVariants, type SkeletonVariants } from './Skeleton.variants';

export interface SkeletonProps extends ComponentPropsWithoutRef<'div'>, SkeletonVariants {}

/**
 * Loading placeholder. Use sized via `className` (e.g. `w-32 h-4`) for text
 * lines, or as a full block with `shape="rect"`.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shape, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(skeletonVariants({ shape }), className)}
      {...props}
    />
  ),
);
Skeleton.displayName = 'Skeleton';
