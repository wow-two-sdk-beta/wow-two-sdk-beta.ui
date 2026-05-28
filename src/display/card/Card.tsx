import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn, surfaceVariants, type SurfaceVariants } from '../../utils';

type DivProps = ComponentPropsWithoutRef<'div'>;

/** Represents the prop surface of `Card`. */
export interface CardProps extends DivProps, SurfaceVariants {}

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, tone, radius, padding, elevation, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        surfaceVariants({
          variant: variant ?? 'surface',
          tone,
          radius: radius ?? 'lg',
          padding: padding ?? 'none',
          elevation: elevation ?? 1,
        }),
        className,
      )}
      {...props}
    />
  ),
);
CardRoot.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col gap-1 p-4 pb-2', className)} {...props} />
));
CardHeader.displayName = 'Card.Header';

const CardTitle = forwardRef<HTMLHeadingElement, ComponentPropsWithoutRef<'h3'>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold tracking-tight', className)} {...props} />
  ),
);
CardTitle.displayName = 'Card.Title';

const CardDescription = forwardRef<HTMLParagraphElement, ComponentPropsWithoutRef<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  ),
);
CardDescription.displayName = 'Card.Description';

const CardBody = forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-2', className)} {...props} />
));
CardBody.displayName = 'Card.Body';

const CardFooter = forwardRef<HTMLDivElement, DivProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center gap-2 border-t border-border p-4', className)} {...props} />
));
CardFooter.displayName = 'Card.Footer';

/** Provides a compound `Card` — raised surface for grouped content with optional sub-components. */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
});
