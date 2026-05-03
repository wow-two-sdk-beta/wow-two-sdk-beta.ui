import { forwardRef, type ReactNode } from 'react';
import { cn } from '../../utils';
import { useId } from '../../hooks';
import { Switch, type SwitchProps } from '../switch/Switch';

export interface SwitchFieldProps extends Omit<SwitchProps, 'children'> {
  label: ReactNode;
  description?: ReactNode;
  /** Place the switch on the left (default) or right of the label. */
  side?: 'left' | 'right';
  wrapperClassName?: string;
}

/**
 * Switch + label + optional description in a single clickable `<label>`.
 * `side="right"` is the common settings-row pattern (label left, switch right).
 */
export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(
  ({ label, description, side = 'left', id, wrapperClassName, className, ...props }, ref) => {
    const generated = useId();
    const inputId = id ?? generated;
    const text = (
      <span className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium text-foreground">{label}</span>
        {description && <span className="text-muted-foreground">{description}</span>}
      </span>
    );
    return (
      <label
        htmlFor={inputId}
        className={cn(
          'flex cursor-pointer items-start gap-3',
          side === 'right' && 'flex-row-reverse justify-between',
          wrapperClassName,
        )}
      >
        <Switch ref={ref} id={inputId} className={className} {...props} />
        {text}
      </label>
    );
  },
);
SwitchField.displayName = 'SwitchField';
