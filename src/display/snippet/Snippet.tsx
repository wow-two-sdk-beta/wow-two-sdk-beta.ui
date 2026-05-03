import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { useClipboard } from '../../hooks';
import { Code } from '../code/Code';

export interface SnippetProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Code text to display + copy. */
  text: string;
  /** Visual variant — `inline` (single line) or `block` (multi-line). Default `inline`. */
  variant?: 'inline' | 'block';
}

/**
 * Code text with a built-in copy button. Inline variant for one-liners,
 * block variant for multi-line snippets. Copy logic uses the L1
 * `useClipboard` hook directly (Snippet stays in display, can't import the
 * actions/CopyButton component).
 */
export const Snippet = forwardRef<HTMLDivElement, SnippetProps>(
  ({ text, variant = 'inline', className, ...props }, ref) => {
    const { copied, copy } = useClipboard();
    return (
      <div
        ref={ref}
        className={cn(
          'group relative inline-flex w-full items-start',
          variant === 'inline' ? 'gap-2' : 'flex-col gap-0',
          className,
        )}
        {...props}
      >
        <Code variant={variant} className="flex-1 pr-10">{text}</Code>
        <button
          type="button"
          aria-label={copied ? 'Copied' : 'Copy'}
          onClick={() => void copy(text)}
          className={cn(
            'absolute right-2 grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            variant === 'inline' ? 'top-1/2 -translate-y-1/2' : 'top-2',
          )}
        >
          <Icon icon={copied ? Check : Copy} size={14} />
        </button>
      </div>
    );
  },
);
Snippet.displayName = 'Snippet';
