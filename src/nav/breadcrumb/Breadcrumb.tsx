import { Fragment, forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface BreadcrumbItem {
  label: ReactNode;
  /** Make this item a link. Last item is typically rendered as plain text. */
  href?: string;
}

export interface BreadcrumbProps extends ComponentPropsWithoutRef<'nav'> {
  items: BreadcrumbItem[];
  /** Custom separator element. Default chevron-right icon. */
  separator?: ReactNode;
}

/**
 * Linear position trail — list of links + separators. The last item is
 * always rendered as `aria-current="page"` and not a link. Use the L5
 * collapsing version when the chain gets long.
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator, className, ...props }, ref) => {
    const sep = separator ?? <Icon icon={ChevronRight} size={14} />;
    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn('text-sm', className)} {...props}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <Fragment key={i}>
                <li>
                  {item.href && !isLast ? (
                    <a
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined} className="text-foreground">
                      {item.label}
                    </span>
                  )}
                </li>
                {!isLast && (
                  <li aria-hidden="true" className="text-subtle-foreground">
                    {sep}
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    );
  },
);
Breadcrumb.displayName = 'Breadcrumb';
