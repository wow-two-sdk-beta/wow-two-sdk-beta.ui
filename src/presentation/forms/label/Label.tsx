import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn, Size } from '../../../foundation/utils';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** The required state, showing a `*` indicator. Auto-derived from `FormControl.isRequired` when present. */
  isRequired?: boolean;

  /** The visual size. Default `md`. */
  size?: Size;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
};

/**
 * `<label>` wired to `FormControl` context — when wrapped in a `FormControl`
 * it auto-fills `htmlFor` and `id`. Standalone use: pass `htmlFor` directly.
 */
export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, isRequired: isRequiredProp, size = Size.Md, htmlFor, id, children, ...props }, ref) => {
    const ctx = useFormControl();
    const isRequired = isRequiredProp ?? ctx?.isRequired ?? false;
    return (
      <label
        ref={ref}
        htmlFor={htmlFor ?? ctx?.id}
        id={id ?? ctx?.labelId}
        className={cn(
          SIZE[size] ?? SIZE.md,
          'font-medium text-foreground',
          ctx?.isDisabled && 'opacity-60',
          className,
        )}
        {...props}
      >
        {children}
        {isRequired && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
      </label>
    );
  },
);
Label.displayName = 'Label';
