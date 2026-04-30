import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
} from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils';
import { Icon } from '../../icons';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../_styles';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    InputBaseVariants {
  /** Show a clear (×) button when the input has a value. Default true. */
  clearable?: boolean;
  onClear?: () => void;
}

/**
 * Search input with leading search icon and optional clear button.
 * Buttons are raw `<button>` elements to keep the strict atom rule.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      size,
      state,
      id,
      disabled,
      required,
      readOnly,
      clearable = true,
      onClear,
      onChange,
      defaultValue,
      value,
      ...props
    },
    forwardedRef,
  ) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    const isDisabled = disabled ?? ctx?.isDisabled ?? false;
    const inputRef = useRef<HTMLInputElement | null>(null);
    useImperativeHandle(forwardedRef, () => inputRef.current as HTMLInputElement);
    const isControlled = value !== undefined;
    const [uncontrolled, setUncontrolled] = useState(defaultValue ?? '');
    const currentValue = isControlled ? value : uncontrolled;
    const showClear = clearable && String(currentValue ?? '').length > 0;

    const handleClear = () => {
      const el = inputRef.current;
      if (el) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
          ?.set;
        setter?.call(el, '');
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.focus();
      }
      if (!isControlled) setUncontrolled('');
      onClear?.();
    };

    return (
      <div className={cn('relative', className)}>
        <Icon
          icon={Search}
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          ref={inputRef}
          type="search"
          id={id ?? ctx?.id}
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? (defaultValue as string | number | undefined) : undefined}
          onChange={(e) => {
            if (!isControlled) setUncontrolled(e.target.value);
            onChange?.(e);
          }}
          disabled={isDisabled}
          required={required ?? ctx?.isRequired}
          readOnly={readOnly ?? ctx?.isReadOnly}
          aria-invalid={ctx?.isInvalid || undefined}
          aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
          className={cn(
            inputBaseVariants({ size, state: finalState }),
            'pl-9',
            showClear && 'pr-9',
            '[&::-webkit-search-cancel-button]:appearance-none',
          )}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <Icon icon={X} size={14} />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = 'SearchInput';
