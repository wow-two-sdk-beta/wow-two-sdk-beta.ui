import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** Show a `*` indicator. Auto-derived from `FormControl.isRequired` when present. */
  required?: boolean;
}

/**
 * `<label>` wired to `FormControl` context — when wrapped in a `FormControl`
 * it auto-fills `htmlFor` and `id`. Standalone use: pass `htmlFor` directly.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, htmlFor, id, children, ...props }, ref) => {
    const ctx = useFormControl();
    const isRequired = required ?? ctx?.isRequired ?? false;
    return (
      <label
        ref={ref}
        htmlFor={htmlFor ?? ctx?.id}
        id={id ?? ctx?.labelId}
        className={cn(
          'text-sm font-medium text-neutral-900',
          ctx?.isDisabled && 'opacity-60',
          className,
        )}
        {...props}
      >
        {children}
        {isRequired && <span className="ml-0.5 text-danger-500" aria-hidden="true">*</span>}
      </label>
    );
  },
);
Label.displayName = 'Label';
