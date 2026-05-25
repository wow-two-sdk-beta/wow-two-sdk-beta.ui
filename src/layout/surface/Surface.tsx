import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { Slot } from '../../primitives';
import { cn, surfaceVariants, type SurfaceVariants } from '../../utils';

const COMPONENT_NAME = 'Surface';

/** Represents the prop surface of the `Surface` atom. */
export interface SurfaceProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'children'>,
    SurfaceVariants {
  /** Names the HTML element to render; defaults to `div`. */
  as?: ElementType;
  /** Merges styles onto the immediate child instead of rendering a wrapper. */
  asChild?: boolean;
  children?: React.ReactNode;
}

/** Provides a styled visual surface composed from the `surfaceVariants` matrix. */
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
