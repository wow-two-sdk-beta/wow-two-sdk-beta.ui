import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { checkboxVariants, type CheckboxVariants } from './Checkbox.variants';

const COMPONENT_NAME = 'Checkbox';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    CheckboxVariants {
  /* Box size — sm 16px · md 20px · lg 24px. */
  size?: 'sm' | 'md' | 'lg';

  /* Tristate visual — input stays `checked={false}` but renders as a dash with the same checked-state styling. */
  indeterminate?: boolean;
}

const SIZE_CLASS: Record<NonNullable<CheckboxProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

/* When indeterminate=true, apply the compound's checked classes regardless of peer-checked state. */
const INDETERMINATE_CHECKED_CLASS: Record<
  NonNullable<CheckboxVariants['variant']>,
  Record<NonNullable<CheckboxVariants['tone']>, string>
> = {
  solid: {
    primary: 'bg-primary border-primary text-primary-foreground',
    neutral: 'bg-foreground border-foreground text-background',
    danger:  'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-success border-success text-success-foreground',
    warning: 'bg-warning border-warning text-warning-foreground',
  },
  soft: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger:  'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  outline: {
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-foreground text-background',
    danger:  'bg-destructive text-destructive-foreground',
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
  },
  ghost: {
    primary: 'bg-primary/10 text-primary',
    neutral: 'bg-muted text-foreground',
    danger:  'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
  },
  glass: {
    primary: 'bg-primary border-primary text-white',
    neutral: 'bg-foreground border-foreground text-background',
    danger:  'bg-destructive border-destructive text-white',
    success: 'bg-success border-success text-white',
    warning: 'bg-warning border-warning text-white',
  },
  'glass-surface': {
    primary: 'bg-primary border-white/60 text-white',
    neutral: 'bg-foreground border-white/60 text-background',
    danger:  'bg-destructive border-white/60 text-white',
    success: 'bg-success border-white/60 text-white',
    warning: 'bg-warning border-white/60 text-white',
  },
};

/* Native checkbox with custom visual. Renders the input visually hidden but accessible — wrap in a `<label>` (or pair with `Label` via `FormControl`). Supports 6 variants × 5 tones matrix + indeterminate. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size = 'md',
      indeterminate,
      variant = 'solid',
      tone = 'primary',
      id,
      disabled,
      required,
      checked,
      ...props
    },
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
            checkboxVariants({ variant, tone }),
            indeterminate && INDETERMINATE_CHECKED_CLASS[variant][tone],
          )}
        >
          {indeterminate ? (
            <Minus className="h-3 w-3" />
          ) : (
            <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100" />
          )}
        </span>
      </span>
    );
  },
);

Checkbox.displayName = COMPONENT_NAME;
