import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface InfoRowProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  label: ReactNode;
  value: ReactNode;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Layout: `inline` puts label-value on one line; `stacked` puts value below. Default `inline`. */
  layout?: 'inline' | 'stacked';
}

/**
 * Single row of label + value, with optional leading icon. Reach for this
 * when you have one or two pairs to show (e.g. inside a Card row); use
 * `DescriptionList` for many pairs.
 */
export const InfoRow = forwardRef<HTMLDivElement, InfoRowProps>(
  ({ label, value, icon, layout = 'inline', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex text-sm',
        layout === 'inline' ? 'items-center justify-between gap-3' : 'flex-col gap-0.5',
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  ),
);
InfoRow.displayName = 'InfoRow';
