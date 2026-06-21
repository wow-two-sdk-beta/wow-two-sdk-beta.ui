import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { cn, surfaceVariants, type SurfaceTone } from '../../utils';
import { Container, type ContainerProps } from '../container';
import {
  navbarVariants,
  type NavbarHeight,
} from './Navbar.variants';

export interface NavbarProps
  extends Omit<ComponentPropsWithoutRef<'header'>, 'children'> {
  /** Leading slot — laid out at the start of the row (brand / logo / nav links). */
  start?: ReactNode;
  /** Centre slot — laid out in the middle of the row (search / primary nav). */
  center?: ReactNode;
  /** Trailing slot — laid out at the end of the row (actions / avatar / CTA). */
  end?: ReactNode;
  /**
   * Raw row content — replaces the `start` / `center` / `end` slot layout when
   * provided. Use for fully custom bars.
   */
  children?: ReactNode;
  /** Max-width of the inner centered `Container`. Passthrough to `Container.size`. Default `lg`. */
  containerSize?: ContainerProps['size'];
  /** Band height. Default `md`. */
  height?: NavbarHeight;
  /** Sticks the bar to the top of the scroll container. Default `false` (non-sticky). */
  sticky?: boolean;
  /**
   * Tinted background tone for the band — applies the shadow-less `subtle`
   * surface treatment. Omit for a transparent bar (relies on `bordered` / page bg).
   */
  tone?: SurfaceTone;
  /** Renders a bottom border under the bar. Default `true`. */
  bordered?: boolean;
}

/**
 * Lightweight header band (`<header>`) with `start` / `center` / `end` slots
 * laid out in a row inside a centered `Container`. The everyday "navbar +
 * centered content" need that `AppShell` (a 5-slot dashboard grid w/ sidebar)
 * overshoots. Non-sticky by default; pass `sticky` to pin it.
 */
export const Navbar = forwardRef<HTMLElement, NavbarProps>(function Navbar(
  {
    start,
    center,
    end,
    children,
    containerSize,
    height,
    sticky = false,
    tone,
    bordered = true,
    className,
    ...rest
  },
  ref,
) {
  return (
    <header
      ref={ref}
      className={cn(
        navbarVariants({ sticky, height }),
        bordered && 'border-b border-border',
        tone ? surfaceVariants({ variant: 'subtle', tone, radius: 'none' }) : 'bg-card',
        className,
      )}
      {...rest}
    >
      <Container size={containerSize} className="flex h-full items-center gap-3">
        {children ?? (
          <>
            {start != null && (
              <div className="flex min-w-0 items-center gap-3">{start}</div>
            )}
            {center != null && (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-3">
                {center}
              </div>
            )}
            {/* Push `end` to the trailing edge when there's no centre slot to absorb the slack. */}
            {end != null && (
              <div
                className={cn(
                  'flex min-w-0 items-center gap-3',
                  center == null && 'ml-auto',
                )}
              >
                {end}
              </div>
            )}
          </>
        )}
      </Container>
    </header>
  );
});

Navbar.displayName = 'Navbar';
