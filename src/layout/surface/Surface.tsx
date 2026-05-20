import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { Slot } from '../../primitives';
import { cn, surfaceVariants, type SurfaceVariants } from '../../utils';

const COMPONENT_NAME = 'Surface';

export interface SurfaceProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    SurfaceVariants {
  /** HTML element to render. Default `div`. */
  as?: ElementType;
  /** Merge styles onto the immediate child instead of rendering a wrapper. */
  asChild?: boolean;
  children?: React.ReactNode;
}

/**
 * Visual surface primitive. Renders a styled block using the project-wide
 * `surfaceVariants` matrix (variant × tone × radius × padding × elevation).
 *
 * Composed internally by popovers, menus, dialogs, drawers, cards, toasts,
 * and any other "block of content with a visual treatment" in the lib.
 * Consumers can also use it directly for ad-hoc panels.
 */
export const Surface = forwardRef<HTMLElement, SurfaceProps>(function Surface(
  {
    as: Component = 'div',
    asChild = false,
    variant,
    tone,
    radius,
    padding,
    elevation,
    className,
    children,
    ...rest
  },
  ref,
) {
  const composed = cn(
    surfaceVariants({ variant, tone, radius, padding, elevation }),
    className,
  );

  if (asChild) {
    return (
      <Slot ref={ref as Ref<HTMLElement>} className={composed} {...rest}>
        {children}
      </Slot>
    );
  }

  return (
    <Component ref={ref as Ref<HTMLElement>} className={composed} {...rest}>
      {children}
    </Component>
  );
});

Surface.displayName = COMPONENT_NAME;
