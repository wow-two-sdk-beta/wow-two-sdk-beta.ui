import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useId } from '../../hooks';
import { Radio, type RadioProps } from '../radio/Radio';

export interface ChoiceCardProps extends Omit<RadioProps, 'children' | 'size'> {
  label: ReactNode;
  description?: ReactNode;
  /** Optional icon rendered above the label. */
  icon?: ReactNode;
  /** Card size. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<ChoiceCardProps['size']>, string> = {
  sm: 'p-3 text-xs',
  md: 'p-4 text-sm',
  lg: 'p-5 text-base',
};

/**
 * Radio styled as a clickable card with title + description + optional
 * icon. Common for plan/option pickers. Compose inside `RadioGroup` for
 * mutex selection.
 */
export const ChoiceCard = forwardRef<HTMLInputElement, ChoiceCardProps>(
  ({ label, description, icon, size = 'md', id, className, ...props }, ref) => {
    const generated = useId();
    const inputId = id ?? generated;
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'group relative block cursor-pointer rounded-lg border border-input bg-card text-card-foreground transition-colors',
          'hover:border-border-strong has-[:checked]:border-primary has-[:checked]:bg-primary-soft/30',
          'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
          SIZE[size],
          className,
        )}
      >
        <Radio ref={ref} id={inputId} className="absolute right-3 top-3" {...props} />
        <div className="flex items-start gap-3 pr-7">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="font-medium text-foreground">{label}</div>
            {description && <div className="mt-0.5 text-muted-foreground">{description}</div>}
          </div>
        </div>
      </label>
    );
  },
);
ChoiceCard.displayName = 'ChoiceCard';
