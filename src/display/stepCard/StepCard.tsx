import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { Card } from '../card/Card';
import { Heading } from '../heading/Heading';
import { Text } from '../text/Text';

export interface StepCardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  /** Step number — rendered as a large faint overlay top-right. */
  step: number;
  /** Icon node rendered inside a tinted badge (`bg-primary-soft text-primary`). Size it yourself. */
  icon?: ReactNode;
  /** Step title. */
  title: ReactNode;
  /** Optional supporting copy below the title. Falls back to `children` when omitted. */
  description?: ReactNode;
  /** Body content — used when `description` is not provided. */
  children?: ReactNode;
}

/**
 * Numbered "how it works" step — large faint step number overlay + tinted icon
 * badge + title + description. Outlined card; content-only (no baked routing).
 */
export const StepCard = forwardRef<HTMLDivElement, StepCardProps>(
  ({ step, icon, title, description, children, className, ...props }, ref) => (
    <Card
      ref={ref}
      variant="outline"
      radius="xl"
      elevation={0}
      className={cn('relative overflow-hidden bg-card p-6', className)}
      {...props}
    >
      <span className="absolute right-4 top-3 text-5xl font-bold text-foreground/5">{step}</span>
      {icon && (
        <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </span>
      )}
      <Heading level={3} size="md" className={cn('tracking-normal', icon && 'mt-4')}>
        {title}
      </Heading>
      {(description ?? children) && (
        <Text size="sm" color="muted" className="mt-2">
          {description ?? children}
        </Text>
      )}
    </Card>
  ),
);
StepCard.displayName = 'StepCard';
