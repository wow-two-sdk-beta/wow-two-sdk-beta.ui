import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface InputAddonProps extends ComponentPropsWithoutRef<'div'> {
  /** Element rendered to the left of the input (e.g. "https://"). */
  leading?: ReactNode;
  /** Element rendered to the right of the input (e.g. ".com"). */
  trailing?: ReactNode;
  /** The input element (TextInput, EmailInput, etc.). */
  children: ReactNode;
}

/**
 * Wrap any input with leading and/or trailing addon slots — visually
 * connected to the input border. Common for protocol prefixes, units,
 * suffixes ("https://", ".com", "kg").
 */
export const InputAddon = forwardRef<HTMLDivElement, InputAddonProps>(
  ({ leading, trailing, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex w-full items-stretch [&>*]:rounded-none',
        '[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md',
        '[&>*:not(:first-child)]:-ml-px',
        className,
      )}
      {...props}
    >
      {leading && (
        <span className="inline-flex shrink-0 items-center border border-input bg-muted px-3 text-sm text-muted-foreground">
          {leading}
        </span>
      )}
      {children}
      {trailing && (
        <span className="inline-flex shrink-0 items-center border border-input bg-muted px-3 text-sm text-muted-foreground">
          {trailing}
        </span>
      )}
    </div>
  ),
);
InputAddon.displayName = 'InputAddon';
