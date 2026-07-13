import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import { Icon } from '../../../foundation/icons';
import { tagVariants, type TagVariant, type TagVariants } from './Tag.variants';

export interface TagProps
  extends Omit<ComponentPropsWithoutRef<'span'>, 'children'>,
    Omit<TagVariants, 'variant'> {
  children?: ReactNode;
  /** The color treatment. */
  variant?: TagVariant;
  /** Fires when the close (×) button is clicked; pass a handler to show the button. */
  onClose?: () => void;
  /** The accessible label for the close button. Default `"Remove"`. */
  closeLabel?: string;
}

/**
 * Pill with an optional close button. The close button is a raw `<button>`
 * to keep the strict atom rule (Tag is L3, so importing Button would make
 * this an atom-on-atom composition).
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
          className="-mr-1 inline-flex h-4 w-4 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Icon icon={X} size={12} />
        </button>
      )}
    </span>
  ),
);
Tag.displayName = 'Tag';
