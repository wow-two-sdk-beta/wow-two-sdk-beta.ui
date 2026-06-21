import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentPropsWithoutRef,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { inputBaseVariants } from '../InputStyles';

export interface PinInputProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children' | 'onChange'> {
  /** Number of digit cells. Default 6. */
  length?: number;
  /** Controlled value (full string). */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Fires whenever the value changes. */
  onValueChange?: (value: string) => void;
  /** Fires when the user fills the final cell. */
  onComplete?: (value: string) => void;
  /** Restrict to digits (`numeric`) or any single char (`alphanumeric`). Default `numeric`. */
  type?: 'numeric' | 'alphanumeric';
  /** Cell visual size. Default `md`. */
  size?: 'sm' | 'md' | 'lg';
  /** Render each cell as `*` (good for verification codes). */
  isMasked?: boolean;
  isDisabled?: boolean;
}

const SIZE: Record<NonNullable<PinInputProps['size']>, string> = {
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
      type = 'numeric',
      size = 'md',
      isMasked,
      isDisabled,
      className,
      ...props
    },
    ref,
  ) => {
    /* Per-cell array state — a joined string compacts empties, remapping cell i to char 0. */
    const toCells = (s: string) => Array.from({ length }, (_, i) => s[i] ?? '');
    const [cells, setCells] = useControlled<string[]>({
      controlled: value === undefined ? undefined : toCells(value),
      default: toCells(defaultValue ?? ''),
      onChange: (next) => onValueChange?.(next.join('')),
    });
    const inputs = useRef<(HTMLInputElement | null)[]>([]);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement);

    const isAllowed = (ch: string) =>
      type === 'numeric' ? /^[0-9]$/.test(ch) : /^[A-Za-z0-9]$/.test(ch);

    const update = (next: string[]) => {
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
            inputMode={type === 'numeric' ? 'numeric' : 'text'}
            autoComplete="one-time-code"
            maxLength={1}
            disabled={isDisabled}
            value={ch}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              inputBaseVariants({ state: 'default' }),
              'text-center font-medium',
              SIZE[size],
            )}
          />
        ))}
      </div>
    );
  },
);
PinInput.displayName = 'PinInput';
