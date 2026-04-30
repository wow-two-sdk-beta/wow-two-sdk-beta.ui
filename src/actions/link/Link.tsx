import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { Slot } from '../../primitives/slot/Slot';
import { linkVariants, type LinkVariants } from './Link.variants';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, LinkVariants {
  /** When true, render the child element as the link instead of an `<a>`.
   *  Use for router `<Link>` components from Next.js / React Router. */
  asChild?: boolean;
}

/**
 * Anchor with consistent focus / hover styling. Pass `asChild` to render a
 * router `<Link>` while inheriting our visuals.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        className={cn(linkVariants({ variant, size }), className)}
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
      />
    );
  },
);
Link.displayName = 'Link';
