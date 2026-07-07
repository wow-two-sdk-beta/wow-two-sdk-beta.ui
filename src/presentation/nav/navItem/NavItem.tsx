import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { cn, dataAttr, Size } from '../../../foundation/utils';
import { Slot } from '../../../foundation/primitives';

export interface NavItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The escape hatch to render the child element instead of an `<a>` (router Link). */
  asChild?: boolean;

  /** The leading icon. */
  icon?: ReactNode;

  /** The visual label. */
  children: ReactNode;

  /** The trailing slot — typically a count badge or status dot. */
  trailing?: ReactNode;

  /** The active state (visual + `aria-current="page"`). */
  isActive?: boolean;

  /** The visual size. Default `md`. */
  size?: Size;
}

const SIZE: Record<Size, string> = {
  [Size.Xs]: 'h-7 px-1.5 text-xs gap-1.5',
  [Size.Sm]: 'h-8 px-2 text-sm gap-2',
  [Size.Md]: 'h-9 px-2.5 text-sm gap-2.5',
  [Size.Lg]: 'h-11 px-3 text-base gap-3',
  [Size.Xl]: 'h-12 px-3.5 text-base gap-3.5',
};

/**
 * Sidebar / nav row — icon + label + trailing slot + active state. Default `<a>`;
 * pass `asChild` to forward to a router Link. Sets `aria-current="page"` when `isActive`.
 */
export const NavItem = forwardRef<HTMLAnchorElement, NavItemProps>(
  ({ asChild, icon, children, trailing, isActive, size = Size.Md, className, ...props }, ref) => {
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
