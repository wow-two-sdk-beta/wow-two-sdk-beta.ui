import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn } from '../../../foundation/utils';
import { Slot } from '../../../foundation/primitives/slot/Slot';
import {
  linkVariants,
  type LinkVariants,
  type LinkVariant,
  type LinkSize,
} from './Link.variants';

export interface LinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement>,
    Omit<LinkVariants, 'variant' | 'size'> {
  /** The color treatment. */
  variant?: LinkVariant;
  /** The text size. */
  size?: LinkSize;
  /** The as-child flag — when true, renders the child element as the link instead of an `<a>`.
   *  Use for router `<Link>` components from Next.js / React Router. */
  asChild?: boolean;
}

/** Anchor with consistent focus/hover styling — `asChild` swaps in router links. */
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
