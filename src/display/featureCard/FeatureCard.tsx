import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Card } from '../card/Card';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

export interface FeatureCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Icon node rendered inside a tinted badge (`bg-primary-soft text-primary`). Size it yourself. */
  icon?: ReactNode;
  /** Feature title. */
  title: ReactNode;
  /** Optional supporting copy below the title. Falls back to `children` when omitted. */
  description?: ReactNode;
  /** Body content — used when `description` is not provided. */
  children?: ReactNode;
}

/**
 * Marketing feature tile — tinted icon badge + title + description. Outlined
 * card; content-only (no baked routing). Compose the icon slot with any node.
 */
export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ icon, title, description, children, className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="outline"
      radius="xl"
      elevation={0}
      className={cn('bg-card p-6', className)}
      {...props}
    >
      {icon && (
        <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <Heading level={3} size="md" className={cn('tracking-normal', icon && 'mt-4')}>
        {title}
      </Heading>
      {(description ?? children) && (
        <Text size="sm" color="muted" className="mt-2 leading-relaxed">
          {description ?? children}
        </Text>
      )}
    </Card>
  ),
);
FeatureCard.displayName = 'FeatureCard';
