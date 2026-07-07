import { forwardRef, type ReactNode } from 'react';
import { cn, Side } from '../../../foundation/utils';
import { useId } from '../../../foundation/hooks';
import { Switch, type SwitchProps } from '../switch/Switch';

export interface SwitchFieldProps extends Omit<SwitchProps, 'children'> {
  label: ReactNode;
  description?: ReactNode;
  /** The switch placement — on the left (default) or right of the label. */
  side?: Side;
  wrapperClassName?: string;
}

/**
 * Switch + label + optional description in a single clickable `<label>`.
 * `side="right"` is the common settings-row pattern (label left, switch right).
 */
export const SwitchField = forwardRef<HTMLInputElement, SwitchFieldProps>(
  ({ label, description, side = Side.Left, id, wrapperClassName, className, ...props }, ref) => {
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
          side === Side.Right && 'flex-row-reverse justify-between',
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
