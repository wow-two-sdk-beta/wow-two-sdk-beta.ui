import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { BannerSimple } from '../bannerSimple/BannerSimple';
import type { BannerSimpleVariants } from '../bannerSimple/BannerSimple.variants';

export interface BannerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title'>,
    BannerSimpleVariants {
  icon?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
  closeLabel?: string;
}

/**
 * Slotted full-width banner. Pair with `BannerSimple` (atomic, free-form
 * children) when you don't need the structured slots.
 */
export const Banner = forwardRef<HTMLDivElement, BannerProps>(
  (
    { icon, title, description, actions, onClose, closeLabel = 'Dismiss', severity, className, ...props },
    ref,
  ) => (
    <BannerSimple
      ref={ref}
      severity={severity}
      className={cn('flex items-center gap-4', className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        {title && <span className="font-medium">{title}</span>}
        {description && <span className="opacity-90">{description}</span>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      {onClose && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="-mr-2 grid h-7 w-7 shrink-0 place-items-center rounded text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-current"
        >
          <Icon icon={X} size={16} />
        </button>
      )}
    </BannerSimple>
  ),
);
Banner.displayName = 'Banner';
