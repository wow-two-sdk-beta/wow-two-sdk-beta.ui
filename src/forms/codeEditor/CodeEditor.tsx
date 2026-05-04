import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';

export interface CodeEditorProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'defaultValue' | 'onChange'
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Forward-compat hint; unused by this first-gen component. */
  language?: string;
  tabSize?: number;
  useTabs?: boolean;
  invalid?: boolean;
  /** CSS minHeight on the surface (default `12rem`). */
  minHeight?: string;
}

/**
 * First-generation code editor — styled `<textarea>` + line-number gutter +
 * Tab/Shift-Tab indent handling. **No syntax highlighting** (deferred to a
 * follow-up wrapping Monaco / CodeMirror inside this contract).
 */
export const CodeEditor = forwardRef<HTMLTextAreaElement, CodeEditorProps>(
  function CodeEditor(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      language,
      tabSize = 2,
      useTabs = false,
      disabled,
      readOnly,
      invalid,
      minHeight = '12rem',
      placeholder,
      className,
      onKeyDown,
      onScroll,
      ...rest
    },
    forwardedRef,
  ) {
    const [value, setValue] = useControlled({
      controlled: valueProp,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const gutterRef = useRef<HTMLDivElement | null>(null);
    const [scrollTop, setScrollTop] = useState(0);

    useImperativeHandle(forwardedRef, () => textareaRef.current as HTMLTextAreaElement);

    const lineCount = useMemo(() => value.split('\n').length, [value]);
    const indentChar = useTabs ? '\t' : ' '.repeat(tabSize);

    const insertAtSelection = useCallback(
      (insert: string, selStart: number, selEnd: number) => {
        const next = value.slice(0, selStart) + insert + value.slice(selEnd);
        setValue(next);
        return selStart + insert.length;
      },
      [value, setValue],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || disabled || readOnly) return;
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      if (e.key === 'Tab') {
        e.preventDefault();
        if (start === end) {
          if (e.shiftKey) {
            // Outdent at cursor's line.
            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineSlice = value.slice(lineStart, start);
            const match = useTabs ? /^\t/ : new RegExp(`^ {1,${tabSize}}`);
            const m = match.exec(lineSlice);
            if (m) {
              const next = value.slice(0, lineStart) + lineSlice.slice(m[0].length) + value.slice(start);
              setValue(next);
              requestAnimationFrame(() => {
                if (textareaRef.current) {
                  const newPos = start - m[0].length;
                  textareaRef.current.selectionStart = newPos;
                  textareaRef.current.selectionEnd = newPos;
                }
              });
            }
          } else {
            const newPos = insertAtSelection(indentChar, start, end);
            requestAnimationFrame(() => {
              if (textareaRef.current) {
                textareaRef.current.selectionStart = newPos;
                textareaRef.current.selectionEnd = newPos;
              }
            });
          }
        } else {
          // Multi-line indent / outdent.
          const before = value.slice(0, start);
          const between = value.slice(start, end);
          const after = value.slice(end);
          const lineStartOffset = before.lastIndexOf('\n') + 1;
          const blockStart = before.slice(0, lineStartOffset);
          const block = before.slice(lineStartOffset) + between;
          if (e.shiftKey) {
            const re = useTabs ? /^\t/gm : new RegExp(`^ {1,${tabSize}}`, 'gm');
            const next = blockStart + block.replace(re, '') + after;
            setValue(next);
          } else {
            const next = blockStart + block.replace(/^/gm, indentChar) + after;
            setValue(next);
          }
        }
      }
    };

    const state = invalid ? 'invalid' : 'default';

    // Generate line-number string once per line count.
    const gutterText = useMemo(
      () =>
        Array.from({ length: lineCount }, (_, i) => String(i + 1)).join('\n'),
      [lineCount],
    );

    return (
      <div
        data-state={state}
        data-language={language || undefined}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
        className={cn(
          'relative flex overflow-hidden rounded-md border border-input bg-card text-card-foreground font-mono text-sm shadow-sm',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40',
          state === 'invalid' && 'border-destructive focus-within:border-destructive focus-within:ring-destructive/40',
          disabled && 'cursor-not-allowed opacity-60',
          className,
        )}
        style={{ minHeight }}
      >
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none whitespace-pre overflow-hidden border-r border-border bg-muted/40 px-3 py-2 text-right text-muted-foreground tabular-nums"
          style={{ transform: `translateY(${-scrollTop}px)` }}
        >
          {gutterText}
        </div>
        <textarea
          {...rest}
          ref={composeRefs(forwardedRef, textareaRef)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={(e) => {
            setScrollTop(e.currentTarget.scrollTop);
            onScroll?.(e);
          }}
          disabled={disabled}
          readOnly={readOnly}
          spellCheck={false}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          className="block flex-1 resize-none whitespace-pre overflow-auto bg-transparent px-3 py-2 outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed"
        />
      </div>
    );
  },
);
