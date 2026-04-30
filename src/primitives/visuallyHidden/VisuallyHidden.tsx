import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Visually hidden span — content removed from the visual layout but still
 * announced to screen readers. Use for accessible labels on icon-only
 * affordances and live-region announcements.
 */
export const VisuallyHidden = forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        'm-[-1px] [clip:rect(0_0_0_0)] [clip-path:inset(50%)]',
        className,
      )}
      {...props}
    />
  ),
);
VisuallyHidden.displayName = 'VisuallyHidden';
