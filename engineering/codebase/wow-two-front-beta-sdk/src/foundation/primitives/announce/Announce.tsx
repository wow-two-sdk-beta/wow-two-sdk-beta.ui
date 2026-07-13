import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../utils/cn';

/** Defines the urgency of an ARIA live-region announcement. */
export const Politeness = {
  /** Refers to a non-urgent announcement — `role="status"`, waits for idle. */
  Polite: 'polite',
  /** Refers to an urgent announcement — `role="alert"`, interrupts. */
  Assertive: 'assertive',
} as const;

export type Politeness = (typeof Politeness)[keyof typeof Politeness];

export interface AnnounceProps extends HTMLAttributes<HTMLDivElement> {
  /** The live-region urgency — `polite` → `role="status"`, `assertive` → `role="alert"`. Default `polite`. */
  politeness?: Politeness;
  children?: ReactNode;
}

/**
 * Visually-hidden ARIA live region. Children are announced by screen readers
 * whenever they change. Pair with a stable mount + swappable children for
 * lightweight transient announcements (status updates, toast messages, etc.).
 */
export const Announce = forwardRef<HTMLDivElement, AnnounceProps>(
  ({ politeness = Politeness.Polite, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      role={politeness === Politeness.Assertive ? 'alert' : 'status'}
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
