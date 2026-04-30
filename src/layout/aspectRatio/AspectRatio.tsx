import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export interface AspectRatioProps extends ComponentPropsWithoutRef<'div'> {
  /** Numeric ratio (width/height). Default 1 (square). */
  ratio?: number;
}

/**
 * Constrain children to an aspect ratio (width / height). Children are
 * absolutely positioned and stretched to fill — typically pass a single
 * `<img>`, `<video>`, or `<iframe>` with `className="absolute inset-0 w-full h-full"`.
 */
export const AspectRatio = forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ ratio = 1, className, style, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative w-full', className)}
      style={{ aspectRatio: `${ratio}`, ...style }}
      {...props}
    >
      {children}
    </div>
  ),
);
AspectRatio.displayName = 'AspectRatio';
