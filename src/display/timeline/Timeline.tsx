import {
  Children,
  createContext,
  forwardRef,
  isValidElement,
  useContext,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';

export type TimelineStatus =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info';

interface TimelineContextValue {
  align: 'left' | 'right';
  total: number;
}

const TimelineContext = createContext<TimelineContextValue | null>(null);

export interface TimelineProps extends HTMLAttributes<HTMLOListElement> {
  align?: 'left' | 'right';
  children: ReactNode;
}

export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { align = 'left', className, children, ...rest },
  ref,
) {
  const total = Children.toArray(children).filter(isValidElement).length;
  return (
    <TimelineContext.Provider value={{ align, total }}>
      <ol
        ref={ref}
        className={cn(
          'flex list-none flex-col',
          align === 'right' && 'items-end',
          className,
        )}
        {...rest}
      >
        {Children.map(children, (child, idx) => {
          if (!isValidElement(child)) return child;
          return (idx === total - 1
            ? // mark the last item so the connector line is suppressed
              { ...(child as ReactElement<{ 'data-last'?: string }>), props: { ...(child.props as Record<string, unknown>), 'data-last': '' } }
            : child) as ReactNode;
        })}
      </ol>
    </TimelineContext.Provider>
  );
});

const STATUS_BG: Record<TimelineStatus, string> = {
  default: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary text-primary-foreground border-primary',
  success: 'bg-success text-success-foreground border-success',
  warning: 'bg-warning text-warning-foreground border-warning',
  destructive: 'bg-destructive text-destructive-foreground border-destructive',
  info: 'bg-info text-info-foreground border-info',
};

export interface TimelineItemProps extends HTMLAttributes<HTMLLIElement> {
  status?: TimelineStatus;
  icon?: ReactNode;
  children: ReactNode;
}

export const TimelineItem = forwardRef<HTMLLIElement, TimelineItemProps>(function TimelineItem(
  { status = 'default', icon, className, children, ...rest },
  ref,
) {
  const ctx = useContext(TimelineContext);
  const isLast = (rest as { 'data-last'?: string })['data-last'] !== undefined;

  return (
    <li
      ref={ref}
      data-status={status}
      className={cn('relative flex gap-3 pb-6 last:pb-0', className)}
      {...rest}
    >
      {/* Marker + connector column */}
      <div className="relative flex flex-col items-center">
        <span
          aria-hidden="true"
          className={cn(
            'relative z-10 grid h-7 w-7 place-items-center rounded-full border-2',
            STATUS_BG[status],
          )}
        >
          {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-current" />}
        </span>
        {!isLast && (
          <span
            aria-hidden="true"
            className={cn(
              'absolute left-1/2 top-7 h-full w-px -translate-x-1/2 bg-border',
            )}
          />
        )}
      </div>
      {/* Content */}
      <div className={cn('flex-1 pt-0.5', ctx?.align === 'right' && 'order-first text-right')}>
        {children}
      </div>
    </li>
  );
});

export interface TimelineTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function TimelineTitle({ className, children, ...rest }: TimelineTitleProps) {
  return (
    <h4 className={cn('text-sm font-medium text-foreground', className)} {...rest}>
      {children}
    </h4>
  );
}

export interface TimelineDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function TimelineDescription({
  className,
  children,
  ...rest
}: TimelineDescriptionProps) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)} {...rest}>
      {children}
    </p>
  );
}

type TimelineComponent = typeof Timeline & {
  Item: typeof TimelineItem;
  Title: typeof TimelineTitle;
  Description: typeof TimelineDescription;
};

(Timeline as TimelineComponent).Item = TimelineItem;
(Timeline as TimelineComponent).Title = TimelineTitle;
(Timeline as TimelineComponent).Description = TimelineDescription;

export default Timeline as TimelineComponent;
