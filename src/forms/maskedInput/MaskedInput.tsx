import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';

export interface MaskedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'value' | 'defaultValue' | 'onChange'>,
    InputBaseVariants {
  /** Mask pattern. `#` = digit, `A` = alpha, `*` = alphanumeric, anything else = literal. */
  mask: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

function applyMask(raw: string, mask: string): string {
  let out = '';
  let r = 0;
  for (let m = 0; m < mask.length && r < raw.length; m++) {
    const tok = mask[m];
    const ch = raw[r];
    if (!tok || !ch) break;
    if (tok === '#') {
      if (/[0-9]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else if (tok === 'A') {
      if (/[A-Za-z]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else if (tok === '*') {
      if (/[A-Za-z0-9]/.test(ch)) {
        out += ch;
        r++;
      } else {
        r++;
        m--;
      }
    } else {
      // literal
      out += tok;
      if (ch === tok) r++;
    }
  }
  return out;
}

/**
 * Text input with a simple character-class mask. Tokens: `#` digit, `A`
 * letter, `*` alphanumeric. Anything else is a literal that's auto-inserted.
 *
 * Examples: `"###-###-####"` (US phone), `"##/##/####"` (date), `"AAA-####"`.
 */
export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  (
    { className, size, state, mask, value, defaultValue, onValueChange, id, disabled, required, readOnly, ...props },
    ref,
  ) => {
    const ctx = useFormControl();
    const finalState = state ?? (ctx?.isInvalid ? 'invalid' : 'default');
    const [val, setVal] = useControlled({
      controlled: value,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    return (
      <input
        ref={ref}
        type="text"
        value={val}
        onChange={(e) => setVal(applyMask(e.target.value, mask))}
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        readOnly={readOnly ?? ctx?.isReadOnly}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
        className={cn(inputBaseVariants({ size, state: finalState }), className)}
        {...props}
      />
    );
  },
);
MaskedInput.displayName = 'MaskedInput';
