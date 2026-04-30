import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

export type QuoteProps = ComponentPropsWithoutRef<'blockquote'>;

/**
 * Block quote with subtle left border and italic body text.
 */
export const Quote = forwardRef<HTMLQuoteElement, QuoteProps>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn(
        'border-l-4 border-neutral-200 pl-4 italic text-neutral-700',
        className,
      )}
      {...props}
    />
  ),
);
Quote.displayName = 'Quote';
