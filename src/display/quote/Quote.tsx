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
        'border-l-4 border-border pl-4 italic text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
Quote.displayName = 'Quote';
