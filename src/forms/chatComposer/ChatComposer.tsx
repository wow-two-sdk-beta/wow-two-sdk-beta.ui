import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
  type FormHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Send } from 'lucide-react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';

type SubmitTrigger = 'enter' | 'mod-enter';

export interface ChatComposerProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fires on send (Enter / Mod+Enter / button click). Receives the text value. */
  onSubmit?: (value: string) => void;
  /** Placeholder text. */
  placeholder?: string;
  /** Disable the input + send button. */
  disabled?: boolean;
  /** Slot rendered on the leading edge of the toolbar (e.g. attach button). */
  leading?: ReactNode;
  /** Slot rendered between the leading slot and the send button. */
  trailing?: ReactNode;
  /** Replace or hide the default send button. */
  sendButton?: ReactNode;
  /** Hide the send button entirely (e.g. when consumer renders a custom CTA). */
  hideSendButton?: boolean;
  /** When the textarea should submit. `enter` = Enter alone (default).
   *  `mod-enter` = Cmd/Ctrl+Enter (Enter inserts a newline). */
  submitOn?: SubmitTrigger;
  /** Maximum textarea pixel height before scroll kicks in. Default `200`. */
  maxHeight?: number;
  /** Pass-through textarea props (rows is overridden). */
  textareaProps?: Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'defaultValue' | 'onChange'
  >;
}

/**
 * Chat input row with auto-resizing textarea and send button. Enter sends
 * by default (Shift+Enter inserts a newline); set `submitOn="mod-enter"` to
 * flip the convention. Use `leading` / `trailing` slots for attach / emoji
 * pickers.
 */
export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      onSubmit,
      placeholder = 'Write a message…',
      disabled,
      leading,
      trailing,
      sendButton,
      hideSendButton,
      submitOn = 'enter',
      maxHeight = 200,
      textareaProps,
      className,
      ...props
    },
    ref,
  ) => {
    const [value, setValue] = useControlled({
      controlled: valueProp,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const composedRef = composeRefs(textareaRef, ref);

    const resize = useCallback(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.style.height = 'auto';
      const next = Math.min(ta.scrollHeight, maxHeight);
      ta.style.height = `${next}px`;
      ta.style.overflowY = ta.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [maxHeight]);

    useEffect(() => {
      resize();
    }, [value, resize]);

    const handleSubmit = (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled) return;
      onSubmit?.(trimmed);
      if (valueProp === undefined) setValue('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      textareaProps?.onKeyDown?.(e);
      if (e.defaultPrevented) return;
      const isEnter = e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing;
      const wantsMod = submitOn === 'mod-enter';
      const modPressed = e.metaKey || e.ctrlKey;
      if (isEnter && (wantsMod ? modPressed : !modPressed)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    const isEmpty = value.trim().length === 0;

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          'flex w-full items-end gap-2 rounded-2xl border border-input bg-background px-3 py-2',
          'focus-within:ring-2 focus-within:ring-ring',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        {...props}
      >
        {leading && <div className="flex shrink-0 items-center gap-1 self-end pb-1">{leading}</div>}
        <textarea
          {...textareaProps}
          ref={composedRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'flex-1 resize-none bg-transparent py-1 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none',
            textareaProps?.className,
          )}
        />
        {trailing && <div className="flex shrink-0 items-center gap-1 self-end pb-1">{trailing}</div>}
        {!hideSendButton && (
          sendButton ?? (
            <button
              type="submit"
              disabled={disabled || isEmpty}
              aria-label="Send message"
              className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full self-end',
                isEmpty
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          )
        )}
      </form>
    );
  },
);
ChatComposer.displayName = 'ChatComposer';
