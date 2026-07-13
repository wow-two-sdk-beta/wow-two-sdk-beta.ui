import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../../foundation/utils';

export interface DescriptionListItem {
  label: ReactNode;
  value: ReactNode;
}

/** Defines the DescriptionList row layout. */
export const DescriptionListLayout = {
  /** Refers to label/value on the same line. */
  Inline: 'inline',
  /** Refers to label stacked above its value. */
  Stacked: 'stacked',
} as const;

export type DescriptionListLayout =
  (typeof DescriptionListLayout)[keyof typeof DescriptionListLayout];

/** Defines the DescriptionList inter-row density. */
export const DescriptionListDensity = {
  /** Refers to tight row spacing. */
  Sm: 'sm',
  /** Refers to medium row spacing. */
  Md: 'md',
  /** Refers to loose row spacing. */
  Lg: 'lg',
} as const;

export type DescriptionListDensity =
  (typeof DescriptionListDensity)[keyof typeof DescriptionListDensity];

export interface DescriptionListProps extends Omit<ComponentPropsWithoutRef<'dl'>, 'children'> {
  items: ReadonlyArray<DescriptionListItem>;
  /** The layout direction. `inline` renders label/value on the same line; `stacked` puts label above. */
  layout?: DescriptionListLayout;

  /** The density between rows. Default `md`. */
  density?: DescriptionListDensity;
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
