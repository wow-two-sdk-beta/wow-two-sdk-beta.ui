import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../foundation/utils';
import {
  listItemVariants,
  listVariants,
  type ListMarker,
  type ListSpacing,
  type ListVariants,
} from './List.variants';

export interface ListProps
  extends Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, 'type'>,
    Omit<ListVariants, 'marker' | 'spacing'> {
  isOrdered?: boolean;
  /** The item marker style. */
  marker?: ListMarker;
  /** The vertical spacing between items. */
  spacing?: ListSpacing;
  children: ReactNode;
}

const ListRoot = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
  { isOrdered, marker, spacing, className, children, ...rest },
  ref,
) {
  const Component = (isOrdered ? 'ol' : 'ul') as 'ol';
  return (
    <Component
      ref={ref as React.Ref<HTMLOListElement>}
      className={cn(listVariants({ marker, spacing }), className)}
      {...(rest as HTMLAttributes<HTMLOListElement>)}
    >
      {children}
    </Component>
  );
});

export interface ListItemProps extends LiHTMLAttributes<HTMLLIElement> {
  /** The leading slot — icon, avatar, marker. */
  leading?: ReactNode;

  /** The trailing slot — badge, chevron, status. */
  trailing?: ReactNode;

  /** The auto-check-marker mode — renders a check marker if the parent List uses `marker="check"`. */
  hasCheckMarker?: boolean;
  children: ReactNode;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { leading, trailing, hasCheckMarker, className, children, ...rest },
  ref,
) {
  return (
    <li ref={ref} className={cn(listItemVariants(), className)} {...rest}>
      {hasCheckMarker && (
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-primary">
          <Check className="h-4 w-4" />
        </span>
      )}
      {leading && (
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground">
          {leading}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {trailing && <span className="shrink-0 text-muted-foreground">{trailing}</span>}
    </li>
  );
});

export const List = Object.assign(ListRoot, {
  Item: ListItem,
});

export default List;
