import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn, dataAttr } from '../../utils';
import { Slot } from '../../primitives';

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** When true, render the child element instead of an `<a>` (router Link). */
  asChild?: boolean;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Visual label. */
  children: ReactNode;
  /** Trailing slot — typically a count badge or status dot. */
  trailing?: ReactNode;
  /** Mark active (visual + `aria-current="page"`). */
  isActive?: boolean;
  /** Visual size. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<NavItemProps['size']>, string> = {
  sm: 'h-8 px-2 text-sm gap-2',
  md: 'h-9 px-2.5 text-sm gap-2.5',
  lg: 'h-11 px-3 text-base gap-3',
};

/**
 * Sidebar / nav row — icon + label + trailing slot + active state. Use as
 * a clickable Link (default `<a>`) or pass `asChild` to forward to a router
 * Link. Sets `aria-current="page"` when `isActive`.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ asChild, icon, children, trailing, isActive, size = 'md', className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        aria-current={isActive ? 'page' : undefined}
        data-active={dataAttr(isActive)}
        className={cn(
          'group inline-flex w-full items-center rounded-md font-medium text-foreground transition-colors',
          'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'data-[active]:bg-primary-soft data-[active]:text-primary-soft-foreground',
          SIZE[size],
          className,
        )}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {icon && <span className="text-muted-foreground group-data-[active]:text-current">{icon}</span>}
        <span className="flex-1 truncate text-left">{children}</span>
        {trailing && <span className="shrink-0">{trailing}</span>}
      </Comp>
    );
  },
);
NavItem.displayName = 'NavItem';
