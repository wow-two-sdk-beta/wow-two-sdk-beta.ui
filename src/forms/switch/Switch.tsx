import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  size?: 'sm' | 'md' | 'lg';
}

const TRACK_CLASS: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-4 w-7',
  md: 'h-5 w-9',
  lg: 'h-6 w-11',
};
const THUMB_CLASS: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-3 w-3 peer-checked:translate-x-3',
  md: 'h-4 w-4 peer-checked:translate-x-4',
  lg: 'h-5 w-5 peer-checked:translate-x-5',
};

/**
 * Toggle switch — native checkbox styled as an iOS-style track + thumb.
 * Strict atom: no built-in label; pair via `FormControl` or wrap manually.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, size = 'md', id, disabled, required, ...props }, ref) => {
    const ctx = useFormControl();
    return (
      <span className={cn('relative inline-flex shrink-0', TRACK_CLASS[size], className)}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
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
            'pointer-events-none flex h-full w-full items-center rounded-full bg-neutral-300 px-0.5 transition-colors',
            'peer-checked:bg-brand-600',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-1',
            'peer-disabled:opacity-50',
          )}
        >
          <span
            className={cn(
              'rounded-full bg-white shadow-sm transition-transform duration-150',
              THUMB_CLASS[size],
            )}
          />
        </span>
      </span>
    );
  },
);
Switch.displayName = 'Switch';
