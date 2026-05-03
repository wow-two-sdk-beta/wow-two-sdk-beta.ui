import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';

export interface DescriptionListItem {
  label: ReactNode;
  value: ReactNode;
}

export interface DescriptionListProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  items: DescriptionListItem[];
  /** Layout direction. `inline` renders label/value on the same line; `stacked` puts label above. */
  layout?: 'inline' | 'stacked';
  /** Density between rows. Default `md`. */
  density?: 'sm' | 'md' | 'lg';
}

const ROW_GAP: Record<NonNullable<DescriptionListProps['density']>, string> = {
  sm: 'gap-y-1',
  md: 'gap-y-2',
  lg: 'gap-y-3',
};

/**
 * Semantic `<dl>` for label-value pairs (settings panels, property lists).
 * Inline layout uses a 2-column grid; stacked puts each value below its label.
 */
export const DescriptionList = forwardRef<HTMLDListElement, DescriptionListProps>(
  ({ items, layout = 'inline', density = 'md', className, ...props }, ref) => (
    <dl
      ref={ref}
      className={cn(
        'text-sm',
        layout === 'inline' ? 'grid grid-cols-[max-content_1fr] gap-x-4' : 'flex flex-col gap-1',
        ROW_GAP[density],
        className,
      )}
      {...props}
    >
      {items.map((item, i) => (
        <div key={i} className={cn('contents', layout === 'stacked' && 'flex flex-col gap-0.5')}>
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  ),
);
DescriptionList.displayName = 'DescriptionList';
