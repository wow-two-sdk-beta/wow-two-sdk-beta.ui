import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { tagVariants, type TagVariants } from './Tag.variants';

export interface TagProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    TagVariants {
  children?: ReactNode;
  /** Show a close (×) button. Pass a handler to receive the click. */
  onClose?: () => void;
  /** Accessible label for the close button. Default `"Remove"`. */
  closeLabel?: string;
}

/**
 * Pill with an optional close button. The close button is a raw `<button>`
 * (not `IconButton`) so this stays a strict atom.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ children, onClose, closeLabel = 'Remove', variant, className, ...props }, ref) => (
    <span ref={ref} className={cn(tagVariants({ variant }), className)} {...props}>
      {children}
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500"
        >
          <Icon icon={X} size={12} />
        </button>
      )}
    </span>
  ),
);
Tag.displayName = 'Tag';
