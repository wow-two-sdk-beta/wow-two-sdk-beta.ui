import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type InputHTMLAttributes,
} from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../_styles';

export interface NumberInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {
  step?: number;
}

/**
 * Numeric input with stepper buttons. Steppers are raw `<button>` elements
 * (not `IconButton`) to keep the strict atom rule.
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    { className, size, state, id, disabled, required, readOnly, step = 1, ...props },
    forwardedRef,
  ) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    const inputRef = useRef<HTMLInputElement | null>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);

    const adjust = (direction: 1 | -1) => {
      const el = inputRef.current;
      if (!el || typeof el.stepUp !== 'function') return;
      if (direction === 1) el.stepUp(step);
      else el.stepDown(step);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const isDisabled = disabled ?? ctx?.isDisabled ?? false;

    return (
      <div className={cn('relative', className)}>
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          step={step}
          id={id ?? ctx?.id}
          disabled={isDisabled}
          required={required ?? ctx?.isRequired}
          readOnly={readOnly ?? ctx?.isReadOnly}
          aria-invalid={ctx?.isInvalid || undefined}
          aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
          className={cn(inputBaseVariants({ size, state: finalState }), 'pr-12 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none')}
          {...props}
        />
        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => adjust(-1)}
            aria-label="Decrement"
            className="grid h-7 w-6 place-items-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <Icon icon={Minus} size={14} />
          </button>
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => adjust(1)}
            aria-label="Increment"
            className="grid h-7 w-6 place-items-center rounded text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          >
            <Icon icon={Plus} size={14} />
          </button>
        </div>
      </div>
    );
  },
);
NumberInput.displayName = 'NumberInput';
