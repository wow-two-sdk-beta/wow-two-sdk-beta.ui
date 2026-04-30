import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
  /** Tristate visual — input is `checked={false}` but rendered as a dash. */
  indeterminate?: boolean;
}

const SIZE_CLASS: Record<NonNullable<CheckboxProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Native checkbox with custom visual. Renders the input visually hidden but
 * accessible — wrap in a `<label>` (or pair with `Label` via `FormControl`).
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, size = 'md', indeterminate, id, disabled, required, checked, ...props },
    ref,
  ) => {
    const ctx = useFormControl();
    const isDisabled = disabled ?? ctx?.isDisabled;
    return (
      <span className={cn('relative inline-flex shrink-0', SIZE_CLASS[size], className)}>
        <input
          ref={ref}
          type="checkbox"
          id={id ?? ctx?.id}
          disabled={isDisabled}
          required={required ?? ctx?.isRequired}
          checked={checked}
          aria-invalid={ctx?.isInvalid || undefined}
          aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
          className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none grid h-full w-full place-items-center rounded-sm border border-neutral-300 bg-white text-white transition-colors',
            'peer-checked:border-brand-600 peer-checked:bg-brand-600',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1',
            'peer-disabled:opacity-50',
            indeterminate && 'border-brand-600 bg-brand-600',
          )}
        >
          {indeterminate ? (
            <Minus size={Math.round(SIZE_CLASS[size].length * 1.4)} className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
          )}
        </span>
      </span>
    );
  },
);
Checkbox.displayName = 'Checkbox';
