import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { cn } from '../../utils';

type DivProps = ComponentPropsWithoutRef<'div'>;

export interface CardProps extends DivProps {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const CardRoot = forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'none', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-xs',
        PADDING[padding],
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

/**
 * Compound `Card` — raised surface for grouped content. Use sub-components
 * for structure: `<Card.Header>` (with optional `<Card.Title>` /
 * `<Card.Description>`), `<Card.Body>`, `<Card.Footer>`. Or pass
 * `padding="md"` and free-form children for the simplest case.
 */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
  Description: CardDescription,
  Body: CardBody,
  Footer: CardFooter,
});
