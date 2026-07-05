import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface AnnounceProps extends HTMLAttributes<HTMLDivElement> {
  /** `polite` → `role="status"`, `assertive` → `role="alert"`. Default `polite`. */
  politeness?: 'polite' | 'assertive';
  children?: ReactNode;
}

/**
 * Visually-hidden ARIA live region. Children are announced by screen readers
 * whenever they change. Pair with a stable mount + swappable children for
 * lightweight transient announcements (status updates, toast messages, etc.).
 */
export const Announce = forwardRef<HTMLDivElement, AnnounceProps>(
  ({ politeness = 'polite', className, children, ...rest }, ref) => (
    <div
      ref={ref}
      role={politeness === 'assertive' ? 'alert' : 'status'}
      aria-live={politeness}
      aria-atomic="true"
      className={cn(
        'absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0',
        'm-[-1px] [clip:rect(0_0_0_0)] [clip-path:inset(50%)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
);
Announce.displayName = 'Announce';
