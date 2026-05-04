import {
  Children,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { Bell, X } from 'lucide-react';
import { cn } from '../../utils';

export interface NotificationCenterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Header title. Default `"Notifications"`. */
  title?: ReactNode;
  /** Badge / count rendered next to the title. */
  count?: ReactNode;
  /** Action slot in the header (e.g. "Mark all as read"). */
  headerActions?: ReactNode;
  /** Empty-state node, rendered when no children are provided. */
  emptyState?: ReactNode;
  /** Footer slot (e.g. "View all"). */
  footer?: ReactNode;
  children?: ReactNode;
}

export interface NotificationItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Leading icon / avatar. */
  icon?: ReactNode;
  /** Primary title. */
  title: ReactNode;
  /** Body / description. */
  description?: ReactNode;
  /** Timestamp / relative time label. */
  timestamp?: ReactNode;
  /** Marks this row as unread (bold + leading dot). */
  unread?: boolean;
  /** Trailing actions slot. */
  actions?: ReactNode;
  /** Fires when the row is clicked / activated. */
  onSelect?: () => void;
  /** Renders a dismiss button on hover. */
  onDismiss?: () => void;
}

export const NotificationItem = forwardRef<HTMLDivElement, NotificationItemProps>(
  (
    {
      icon,
      title,
      description,
      timestamp,
      unread,
      actions,
      onSelect,
      onDismiss,
      className,
      ...props
    },
    ref,
  ) => {
    const interactive = !!onSelect;
    return (
      <div
        ref={ref}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        data-unread={unread ? '' : undefined}
        onClick={onSelect}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect?.();
                }
              }
            : undefined
        }
        className={cn(
          'group/notif relative flex gap-3 rounded-md px-3 py-2.5 text-sm',
          interactive &&
            'cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          unread && 'bg-primary-soft/30',
          className,
        )}
        {...props}
      >
        {unread && (
          <span
            aria-hidden="true"
            className="absolute left-1 top-3 inline-block h-2 w-2 rounded-full bg-primary"
          />
        )}
        {icon && <div className="shrink-0 self-start pl-3">{icon}</div>}
        <div className={cn('min-w-0 flex-1', !icon && 'pl-3')}>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'truncate text-foreground',
                unread ? 'font-semibold' : 'font-medium',
              )}
            >
              {title}
            </span>
            {timestamp && (
              <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
                {timestamp}
              </span>
            )}
          </div>
          {description && (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {description}
            </div>
          )}
          {actions && <div className="mt-1.5 flex items-center gap-2">{actions}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className={cn(
              'absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground opacity-0',
              'group-hover/notif:opacity-100 group-focus-within/notif:opacity-100',
              'hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  },
);
NotificationItem.displayName = 'NotificationCenter.Item';

const NotificationCenterInner = forwardRef<HTMLDivElement, NotificationCenterProps>(
  (
    {
      title = 'Notifications',
      count,
      headerActions,
      emptyState,
      footer,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const items = Children.toArray(children).filter(isValidElement);
    const isEmpty = items.length === 0;
    return (
      <div
        ref={ref}
        role="region"
        aria-label="Notifications"
        className={cn(
          'flex w-80 flex-col rounded-md border border-border bg-popover text-popover-foreground shadow-md',
          className,
        )}
        {...props}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{title}</span>
            {count != null && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-5 text-primary-foreground">
                {count}
              </span>
            )}
          </div>
          {headerActions}
        </header>
        <div className="max-h-96 overflow-y-auto py-1">
          {isEmpty ? (
            (emptyState ?? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-muted-foreground">
                <Bell className="h-6 w-6" />
                <p className="text-sm">You're all caught up.</p>
              </div>
            ))
          ) : (
            <div className="flex flex-col">{children}</div>
          )}
        </div>
        {footer && (
          <div className="border-t border-border px-3 py-2 text-center text-xs">
            {footer}
          </div>
        )}
      </div>
    );
  },
);
NotificationCenterInner.displayName = 'NotificationCenter';

type NotificationCenterComponent = typeof NotificationCenterInner & {
  Item: typeof NotificationItem;
};

export const NotificationCenter = NotificationCenterInner as NotificationCenterComponent;
NotificationCenter.Item = NotificationItem;

export default NotificationCenter;
