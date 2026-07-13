import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementType,
  type Ref,
} from 'react';
import { cn } from '../../../foundation/utils';
import {
  containerVariants,
  type ContainerVariants,
  type ContainerSize,
} from './Container.variants';

export interface ContainerProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'as'>,
    Omit<ContainerVariants, 'size'> {
  as?: ElementType;
  /** The max-width preset. Default `lg`. */
  size?: ContainerSize;
}

/**
 * Centered max-width wrapper with horizontal padding. Use at page-level to
 * constrain content width.
 */
export const Container = forwardRef<HTMLElement, ContainerProps>(
  ({ as: Component = 'div', className, size, ...props }, ref) => (
    <Component
      ref={ref as Ref<HTMLElement>}
      className={cn(containerVariants({ size }), className)}
      {...props}
    />
  ),
);
Container.displayName = 'Container';
