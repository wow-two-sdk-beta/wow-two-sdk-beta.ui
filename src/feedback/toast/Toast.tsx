import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { ToastSimple } from '../toastSimple/ToastSimple';
import type { ToastSimpleVariants } from '../toastSimple/ToastSimple.variants';

export interface ToastProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    ToastSimpleVariants {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

/**
 * Slotted toast — visual only (no queue / portal / lifecycle, those land
 * with `Toaster` at L5). Pair: `ToastSimple` (atomic) + `Toast` (molecule).
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    { icon, title, description, actions, onClose, closeLabel = 'Dismiss', severity, className, ...props },
    ref,
  ) => (
    <ToastSimple
      ref={ref}
      severity={severity}
      className={cn('flex items-start gap-3', className)}
      {...props}
    >
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {description && (
          <div className={cn('text-sm', title && 'mt-0.5 text-muted-foreground')}>{description}</div>
        )}
        {actions && <div className="mt-2 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-mr-1 grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Icon icon={X} size={14} />
        </button>
      )}
    </ToastSimple>
  ),
);
Toast.displayName = 'Toast';
