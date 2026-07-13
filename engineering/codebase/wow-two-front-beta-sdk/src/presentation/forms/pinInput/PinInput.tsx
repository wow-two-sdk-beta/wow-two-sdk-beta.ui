import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { cn, Size } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';
import { inputBaseVariants, InputState } from '../InputStyles';

/** Defines the character set a pin-input cell accepts. */
export const PinInputType = {
  /** Refers to digits only (`0-9`). */
  Numeric: 'numeric',
  /** Refers to any single alphanumeric character. */
  Alphanumeric: 'alphanumeric',
} as const;

export type PinInputType = (typeof PinInputType)[keyof typeof PinInputType];

export interface PinInputProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> {
  /** The number of digit cells. Default 6. */
  length?: number;

  /** The controlled value (full string). */
  value?: string;

  /** The uncontrolled initial value. */
  defaultValue?: string;

  /** Emits the value whenever it changes. */
  onValueChange?: (value: string) => void;

  /** Emits the value when the user fills the final cell. */
  onComplete?: (value: string) => void;

  /** The allowed characters — digits (`numeric`) or any single char (`alphanumeric`). Default `numeric`. */
  type?: PinInputType;

  /** The cell visual size. Default `md`. */
  size?: Size;

  /** The masked mode — renders each cell as `*` (good for verification codes). */
  isMasked?: boolean;
  isDisabled?: boolean;
}

/* Sizes not listed fall back to the `md` row at the call site. */
const SIZE: Partial<Record<Size, string>> = {
  sm: 'h-9 w-9 text-base',
  md: 'h-11 w-11 text-lg',
  lg: 'h-14 w-14 text-xl',
};

/**
 * One-time-code / PIN input — N single-character cells with auto-advance,
 * paste-spread, and backspace-to-previous behavior.
 */
export const PinInput = forwardRef<HTMLDivElement, PinInputProps>(
  (
    {
      length = 6,
      value,
      defaultValue,
      onValueChange,
      onComplete,
      type = PinInputType.Numeric,
      size = Size.Md,
      isMasked,
      isDisabled,
      className,
      ...props
    },
    ref,
  ) => {
    /* Per-cell array state — a joined string compacts empties, remapping cell i to char 0. */
    const toCells = (s: string) => Array.from({ length }, (_, i) => s[i] ?? '');
    const [cells, setCells] = useControlled<ReadonlyArray<string>>({
      controlled: value === undefined ? undefined : toCells(value),
      default: toCells(defaultValue ?? ''),
      onChange: (next) => onValueChange?.(next.join('')),
    });
    const inputs = useRef<Array<HTMLInputElement | null>>([]);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement);

    /* FormControlContext adoption — flags cascade onto every cell; the id/describedby
       land on the FIRST cell (the composite's primary input), so `Field`-rendered
       labels/helper reach the control. A user `id` prop stays on the wrapper div. */
    const ctx = useFormControl();
    const disabled = isDisabled ?? ctx?.isDisabled;
    const invalid = ctx?.isInvalid ?? false;

    const isAllowed = (ch: string) =>
      type === PinInputType.Numeric ? /^[0-9]$/.test(ch) : /^[A-Za-z0-9]$/.test(ch);

    const update = (next: ReadonlyArray<string>) => {
      setCells(next);
      if (next.every(Boolean)) onComplete?.(next.join(''));
    };

    const handleChange = (i: number, raw: string) => {
      const ch = raw.slice(-1);
      if (ch && !isAllowed(ch)) return;
      const arr = cells.slice();
      arr[i] = ch;
      update(arr);
      if (ch && i < length - 1) inputs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !cells[i] && i > 0) {
        inputs.current[i - 1]?.focus();
      } else if (e.key === 'ArrowLeft' && i > 0) {
        e.preventDefault();
        inputs.current[i - 1]?.focus();
      } else if (e.key === 'ArrowRight' && i < length - 1) {
        e.preventDefault();
        inputs.current[i + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text').replace(/\s+/g, '');
      const filtered = pasted.split('').filter(isAllowed).join('');
      if (filtered) {
        e.preventDefault();
        update(toCells(filtered));
        const focusIdx = Math.min(filtered.length, length - 1);
        inputs.current[focusIdx]?.focus();
      }
    };

    return (
      <div ref={wrapperRef} className={cn('inline-flex gap-2', className)} {...props}>
        {cells.map((ch, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type={isMasked ? 'password' : 'text'}
            inputMode={type === PinInputType.Numeric ? 'numeric' : 'text'}
            /* Cells are internal — consumers can't label them individually, so each carries a built-in name
               (the aria-label wins over a `Field` label's htmlFor, keeping per-digit announcements). */
            aria-label={`${type === PinInputType.Numeric ? 'Digit' : 'Character'} ${i + 1} of ${length}`}
            id={i === 0 ? ctx?.id : undefined}
            aria-describedby={i === 0 ? ctx?.describedBy : undefined}
            aria-required={i === 0 ? ctx?.isRequired || undefined : undefined}
            aria-invalid={invalid || undefined}
            autoComplete="one-time-code"
            maxLength={1}
            disabled={disabled}
            readOnly={ctx?.isReadOnly || undefined}
            value={ch}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              inputBaseVariants({ state: invalid ? InputState.Invalid : InputState.Default }),
              'text-center font-medium',
              SIZE[size] ?? SIZE.md,
            )}
          />
        ))}
      </div>
    );
  },
);
PinInput.displayName = 'PinInput';
