import {
  forwardRef,
  useEffect,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';
import { formatHex, parseHex } from '../ColorExtensions';
import { ColorSwatch } from '../colorSwatch';

export interface ColorFieldProps
  extends Omit<
      InputHTMLAttributes<HTMLInputElement>,
      'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
    >,
    InputBaseVariants {
  value?: string | null;
  defaultValue?: string | null;
  onChange?: (hex: string | null) => void;
  swatchShape?: 'square' | 'circle';
  withAlpha?: boolean;
}

function commitHex(text: string, withAlpha: boolean): string | null {
  const normalised = text.startsWith('#') ? text : `#${text}`;
  const rgb = parseHex(normalised);
  if (!rgb) return null;
  return formatHex(rgb, { withAlpha });
}

export const ColorField = forwardRef<HTMLInputElement, ColorFieldProps>(function ColorField(
  {
    value,
    defaultValue,
    onChange,
    swatchShape = 'square',
    withAlpha = false,
    size,
    state,
    className,
    id,
    disabled,
    required,
    onBlur,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const ctx = useFormControl();
  const [committed, setCommitted] = useControlled<string | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange,
  });
  const [draft, setDraft] = useState<string>(committed ?? '');

  // Sync draft to committed value when external `value` changes.
  useEffect(() => {
    setDraft(committed ?? '');
  }, [committed]);

  const commit = () => {
    if (!draft) {
      setCommitted(null);
      return;
    }
    const next = commitHex(draft, withAlpha);
    if (next) {
      setCommitted(next);
      setDraft(next);
    } else {
      // Invalid — revert.
      setDraft(committed ?? '');
    }
  };

  return (
    <div className="relative inline-flex w-full items-stretch">
      <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
        <ColorSwatch color={committed ?? '#00000000'} size="sm" shape={swatchShape} />
      </span>
      <input
        ref={ref}
        type="text"
        id={id ?? ctx?.id}
        disabled={disabled ?? ctx?.isDisabled}
        required={required ?? ctx?.isRequired}
        aria-invalid={ctx?.isInvalid || undefined}
        aria-describedby={ctx ? `${ctx.helperId} ${ctx.errorId}` : undefined}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e: FocusEvent<HTMLInputElement>) => {
          onBlur?.(e);
          commit();
        }}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
        }}
        className={cn(
          inputBaseVariants({ size, state: state ?? (ctx?.isInvalid ? 'invalid' : 'default') }),
          'pl-9 font-mono uppercase',
          className,
        )}
        {...rest}
      />
    </div>
  );
});
