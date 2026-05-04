import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils';
import { listItemVariants, listVariants, type ListVariants } from './List.variants';

export interface ListProps
  extends Omit<HTMLAttributes<HTMLUListElement | HTMLOListElement>, 'type'>,
    ListVariants {
  ordered?: boolean;
  children: ReactNode;
}

export const List = forwardRef<HTMLUListElement | HTMLOListElement, ListProps>(function List(
  { ordered, marker, spacing, className, children, ...rest },
  ref,
) {
  const Component = (ordered ? 'ol' : 'ul') as 'ol';
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
  /** Leading slot — icon, avatar, marker. */
  leading?: ReactNode;
  /** Trailing slot — badge, chevron, status. */
  trailing?: ReactNode;
  /** Auto-render a check marker if the parent List uses `marker="check"`. */
  showCheckMarker?: boolean;
  children: ReactNode;
}

export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(function ListItem(
  { leading, trailing, showCheckMarker, className, children, ...rest },
  ref,
) {
  return (
    <li ref={ref} className={cn(listItemVariants(), className)} {...rest}>
      {showCheckMarker && (
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

type ListComponent = typeof List & {
  Item: typeof ListItem;
};

(List as ListComponent).Item = ListItem;

export default List as ListComponent;
