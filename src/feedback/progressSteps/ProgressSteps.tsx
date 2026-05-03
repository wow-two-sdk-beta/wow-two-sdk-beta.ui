import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';

export interface ProgressStepsProps extends ComponentPropsWithoutRef<'ol'> {
  /** Step labels in order. */
  steps: string[];
  /** Index of the active step (0-based). Steps before are marked complete. */
  current: number;
  /** Layout direction. Default `horizontal`. */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Visual N-of-M progress dots / pills with connectors. No state machine —
 * the consumer drives `current`. For full wizard-with-content semantics use
 * the L5 `Stepper` organism.
 */
export const ProgressSteps = forwardRef<HTMLOListElement, ProgressStepsProps>(
  ({ steps, current, orientation = 'horizontal', className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row items-center gap-2' : 'flex-col gap-3',
        className,
      )}
      {...props}
    >
      {steps.map((label, i) => {
        const status = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
        return (
          <li
            key={i}
            className={cn(
              'flex items-center gap-2',
              orientation === 'horizontal' && i < steps.length - 1 && 'flex-1',
            )}
          >
            <span
              className={cn(
                'grid h-7 w-7 place-items-center rounded-full text-xs font-medium',
                status === 'complete' && 'bg-primary text-primary-foreground',
                status === 'current' && 'border-2 border-primary text-primary',
                status === 'upcoming' && 'border border-border text-muted-foreground',
              )}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {status === 'complete' ? <Icon icon={Check} size={14} /> : i + 1}
            </span>
            <span
              className={cn(
                'text-sm',
                status === 'upcoming' ? 'text-muted-foreground' : 'text-foreground',
              )}
            >
              {label}
            </span>
            {orientation === 'horizontal' && i < steps.length - 1 && (
              <span
                className={cn(
                  'h-px flex-1',
                  i < current ? 'bg-primary' : 'bg-border',
                )}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  ),
);
ProgressSteps.displayName = 'ProgressSteps';
