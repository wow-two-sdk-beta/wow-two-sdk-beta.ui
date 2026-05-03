import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { AlertSimple } from '../alertSimple/AlertSimple';
import type { AlertSimpleVariants } from '../alertSimple/AlertSimple.variants';

export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    AlertSimpleVariants {
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Bold heading line. */
  title?: ReactNode;
  /** Body text below the title. */
  description?: ReactNode;
  /** Right-side action slot (typically Button(s)). */
  actions?: ReactNode;
  /** When provided, renders a close button that calls this. */
  onClose?: () => void;
  /** Accessible label for the close button. Default `"Dismiss"`. */
  closeLabel?: string;
}

/**
 * Slotted Alert — Icon + Title + Description + Actions on top of `AlertSimple`.
 * Pair: `AlertSimple` (atom, free-form children) + `Alert` (this molecule).
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    { icon, title, description, actions, onClose, closeLabel = 'Dismiss', severity, className, ...props },
    ref,
  ) => (
    <AlertSimple
      ref={ref}
      severity={severity}
      className={cn('flex items-start gap-3', className)}
      {...props}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && <div className={cn('text-sm', title && 'mt-0.5 opacity-90')}>{description}</div>}
        {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-current opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <Icon icon={X} size={14} />
        </button>
      )}
    </AlertSimple>
  ),
);
Alert.displayName = 'Alert';
