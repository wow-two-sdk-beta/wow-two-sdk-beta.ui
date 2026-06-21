import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { Badge } from '../badge/Badge';
import { Card } from '../card/Card';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

export interface PricingCardProps extends ComponentPropsWithoutRef<'div'> {
  /** Tier name (e.g. "Pro"). */
  name: ReactNode;
  /** Headline price (e.g. "$9"). */
  price: ReactNode;
  /** Billing cadence beside the price (e.g. "/mo"). */
  cadence?: ReactNode;
  /** Short positioning line below the price. */
  tagline?: ReactNode;
  /** Feature bullets — each rendered with a leading `Check`. */
  features: ReadonlyArray<ReactNode>;
  /** Highlight this tier — primary border + shadow + a badge. */
  featured?: boolean;
  /** Badge label shown when `featured`. Default "Most popular". */
  badgeLabel?: ReactNode;
  /** CTA slot pinned to the bottom — pass a `Button` (e.g. `<Button asChild><Link/></Button>`). */
  children?: ReactNode;
}

/**
 * Pricing tier card — name + price baseline + tagline + checked feature list +
 * bottom-pinned CTA slot. Content-only: the CTA is `children`, never baked
 * routing. `featured` adds a primary border, shadow, and "Most popular" badge.
 */
export const PricingCard = forwardRef<HTMLDivElement, PricingCardProps>(
  (
    { name, price, cadence, tagline, features, featured = false, badgeLabel = 'Most popular', children, className, ...props },
    ref,
  ) => (
    <Card
      ref={ref}
      variant="outline"
      radius="2xl"
      elevation={0}
      className={cn(
        'relative flex flex-col bg-card p-6',
        featured ? 'border-primary shadow-lg shadow-primary/10' : 'border-border',
        className,
      )}
      {...props}
    >
      {featured && (
        <Badge
          variant="brand"
          size="md"
          className="absolute -top-3 left-6 bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
        >
          {badgeLabel}
        </Badge>
      )}
      <Heading level={3} size="md" className="tracking-normal">
        {name}
      </Heading>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">{price}</span>
        {cadence && (
          <Text as="span" size="sm" color="muted">
            {cadence}
          </Text>
        )}
      </div>
      {tagline && (
        <Text size="sm" color="muted" className="mt-2">
          {tagline}
        </Text>
      )}
      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Icon icon={Check} size={16} className="mt-0.5 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      {children && <div className="mt-6">{children}</div>}
    </Card>
  ),
);
PricingCard.displayName = 'PricingCard';
