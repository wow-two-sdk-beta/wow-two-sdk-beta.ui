import {
  forwardRef,
  Fragment,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Kbd } from '../../display/kbd';

export interface KeyboardShortcutPickerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (keys: string[]) => void;
  placeholder?: ReactNode;
  recordLabel?: ReactNode;
  /** Hidden input emits `+`-joined chord. */
  name?: string;
}

const MODIFIER_NAMES: Record<string, string> = {
  Control: 'Ctrl',
  Meta: navigator?.platform?.toLowerCase?.().includes('mac') ? '⌘' : 'Meta',
  Alt: 'Alt',
  Shift: 'Shift',
};

function isModifier(key: string): boolean {
  return ['Control', 'Meta', 'Alt', 'Shift'].includes(key);
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'Space';
  if (key.length === 1) return key.toUpperCase();
  return key;
}

/**
 * Capture a key chord. Click record → press keys → captured. Escape cancels;
 * Backspace during listening clears. Output is a normalized name array
 * (e.g. `['Meta', 'Shift', 'K']`).
 */
export const KeyboardShortcutPicker = forwardRef<HTMLButtonElement, KeyboardShortcutPickerProps>(
  function KeyboardShortcutPicker(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      placeholder = 'Click to record',
      recordLabel = 'Press keys…',
      disabled,
      name,
      className,
      type = 'button',
      ...rest
    },
    ref,
  ) {
    const [keys, setKeys] = useControlled<string[]>({
      controlled: valueProp,
      default: defaultValue ?? [],
      onChange: onValueChange,
    });
    const [recording, setRecording] = useState(false);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
      if (!recording) return;
      const handleKey = (e: KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.key === 'Escape') {
          setRecording(false);
          return;
        }
        if (e.key === 'Backspace') {
          setKeys([]);
          setRecording(false);
          return;
        }
        if (isModifier(e.key)) return;
        const captured: string[] = [];
        if (e.metaKey) captured.push('Meta');
        if (e.ctrlKey) captured.push('Control');
        if (e.altKey) captured.push('Alt');
        if (e.shiftKey) captured.push('Shift');
        captured.push(normalizeKey(e.key));
        setKeys(captured);
        setRecording(false);
      };
      const handleClickOutside = (e: MouseEvent) => {
        if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
          setRecording(false);
        }
      };
      document.addEventListener('keydown', handleKey, true);
      document.addEventListener('pointerdown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKey, true);
        document.removeEventListener('pointerdown', handleClickOutside);
      };
    }, [recording, setKeys]);

    const startRecord = () => {
      if (disabled) return;
      setRecording(true);
    };

    const handleButtonKey = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (recording) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startRecord();
      }
    };

    return (
      <>
        <button
          {...rest}
          ref={(el) => {
            buttonRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
          }}
          type={type}
          aria-pressed={recording}
          disabled={disabled}
          onClick={startRecord}
          onKeyDown={handleButtonKey}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            recording && 'border-primary bg-primary-soft text-primary-soft-foreground',
            className,
          )}
        >
          {recording ? (
            <span className="text-xs text-muted-foreground">{recordLabel}</span>
          ) : keys.length === 0 ? (
            <span className="text-xs text-muted-foreground">{placeholder}</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              {keys.map((k, i) => (
                <Fragment key={i}>
                  {i > 0 && <span aria-hidden="true">+</span>}
                  <Kbd>{MODIFIER_NAMES[k] ?? k}</Kbd>
                </Fragment>
              ))}
            </span>
          )}
        </button>
        {name && <input type="hidden" name={name} value={keys.join('+')} />}
      </>
    );
  },
);
