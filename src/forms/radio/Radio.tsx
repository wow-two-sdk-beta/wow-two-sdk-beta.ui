import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS: Record<NonNullable<RadioProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/**
 * Native radio button with custom visual. Use multiple with the same `name`
 * to form a mutually exclusive group; for arrow-key nav, wrap in
 * `RadioGroup` (L4).
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, size = 'md', id, disabled, required, ...props }, ref) => {
    const ctx = useFormControl();
    return (
      <span className={cn('relative inline-flex shrink-0', SIZE_CLASS[size], className)}>
        <input
          ref={ref}
          type="radio"
          id={id ?? ctx?.id}
          disabled={disabled ?? ctx?.isDisabled}
          required={required ?? ctx?.isRequired}
          aria-invalid={ctx?.isInvalid || undefined}
          className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none grid h-full w-full place-items-center rounded-full border border-input bg-background transition-colors',
            'peer-checked:border-primary',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
            'peer-disabled:opacity-50',
          )}
        >
          <span className="h-2 w-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
        </span>
      </span>
    );
  },
);
Radio.displayName = 'Radio';
