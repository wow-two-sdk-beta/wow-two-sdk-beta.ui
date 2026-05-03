import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../_styles';

export interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {
  /** Whether to render the visibility-toggle button. Default true. */
  toggleable?: boolean;
}

/**
 * Password input with optional visibility toggle. Toggle is a raw `<button>`
 * to keep the strict atom rule.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      className,
      size,
      state,
      id,
      disabled,
      required,
      readOnly,
      toggleable = true,
      autoComplete = 'current-password',
      ...props
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(false);
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    const isDisabled = disabled ?? ctx?.isDisabled ?? false;

    return (
      <div className={cn('relative', className)}>
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          spellCheck={false}
          id={id ?? ctx?.id}
          disabled={isDisabled}
          required={required ?? ctx?.isRequired}
          readOnly={readOnly ?? ctx?.isReadOnly}
          aria-invalid={ctx?.isInvalid || undefined}
          aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
          className={cn(inputBaseVariants({ size, state: finalState }), toggleable && 'pr-10')}
          {...props}
        />
        {toggleable && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <Icon icon={visible ? EyeOff : Eye} size={16} />
          </button>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = 'PasswordInput';
