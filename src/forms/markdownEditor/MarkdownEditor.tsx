import {
  forwardRef,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { marked } from 'marked';
import { Bold, Code, Heading1, Heading2, Italic, Link2, List, Quote } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';

export type MarkdownEditorView = 'split' | 'edit' | 'preview';

export interface MarkdownEditorProps
  extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'defaultValue' | 'onChange'
  > {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  view?: MarkdownEditorView;
  defaultView?: MarkdownEditorView;
  onViewChange?: (view: MarkdownEditorView) => void;
  renderPreview?: (markdown: string) => ReactNode;
  invalid?: boolean;
  minHeight?: string;
}

interface ToolbarAction {
  key: string;
  label: string;
  icon: ReactNode;
  apply: (sel: { value: string; start: number; end: number }) => {
    value: string;
    selStart: number;
    selEnd: number;
  };
}

const wrap = (before: string, after: string) =>
  ({ value, start, end }: { value: string; start: number; end: number }) => {
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    const selStart = start + before.length;
    return { value: next, selStart, selEnd: selStart + sel.length };
  };

const linePrefix = (prefix: string) =>
  ({ value, start, end }: { value: string; start: number; end: number }) => {
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const trailing = value.slice(end).indexOf('\n');
    const lineEnd = trailing === -1 ? value.length : end + trailing;
    const block = value.slice(lineStart, lineEnd);
    const updated = block
      .split('\n')
      .map((l) => prefix + l)
      .join('\n');
    const next = value.slice(0, lineStart) + updated + value.slice(lineEnd);
    return { value: next, selStart: lineStart + prefix.length, selEnd: lineStart + updated.length };
  };

const ACTIONS: ToolbarAction[] = [
  { key: 'h1', label: 'Heading 1', icon: <Icon icon={Heading1} size={14} />, apply: linePrefix('# ') },
  { key: 'h2', label: 'Heading 2', icon: <Icon icon={Heading2} size={14} />, apply: linePrefix('## ') },
  { key: 'bold', label: 'Bold', icon: <Icon icon={Bold} size={14} />, apply: wrap('**', '**') },
  { key: 'italic', label: 'Italic', icon: <Icon icon={Italic} size={14} />, apply: wrap('*', '*') },
  { key: 'code', label: 'Inline code', icon: <Icon icon={Code} size={14} />, apply: wrap('`', '`') },
  { key: 'link', label: 'Link', icon: <Icon icon={Link2} size={14} />, apply: wrap('[', '](https://)') },
  { key: 'list', label: 'List', icon: <Icon icon={List} size={14} />, apply: linePrefix('- ') },
  { key: 'quote', label: 'Blockquote', icon: <Icon icon={Quote} size={14} />, apply: linePrefix('> ') },
];

/**
 * Markdown input + live preview. Toolbar wraps selection with syntax;
 * preview pane renders via `marked.parse` (or the consumer-supplied
 * `renderPreview`). Three view modes: `split` / `edit` / `preview`.
 */
export const MarkdownEditor = forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  function MarkdownEditor(
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      view: viewProp,
      defaultView,
      onViewChange,
      renderPreview,
      disabled,
      readOnly,
      invalid,
      minHeight = '18rem',
      placeholder,
      className,
      ...rest
    },
    forwardedRef,
  ) {
    const [value, setValue] = useControlled({
      controlled: valueProp,
      default: defaultValue ?? '',
      onChange: onValueChange,
    });
    const [view, setView] = useControlled({
      controlled: viewProp,
      default: defaultView ?? 'split',
      onChange: onViewChange,
    });
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const groupId = useId();

    useImperativeHandle(forwardedRef, () => textareaRef.current as HTMLTextAreaElement);

    const previewHtml = useMemo(() => {
      if (renderPreview) return null;
      try {
        return marked.parse(value, { async: false }) as string;
      } catch {
        return '<p>Failed to render preview.</p>';
      }
    }, [value, renderPreview]);

    const applyAction = (action: ToolbarAction) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const next = action.apply({
        value,
        start: ta.selectionStart ?? value.length,
        end: ta.selectionEnd ?? value.length,
      });
      setValue(next.value);
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = next.selStart;
        ta.selectionEnd = next.selEnd;
      });
    };

    const showEdit = view === 'split' || view === 'edit';
    const showPreview = view === 'split' || view === 'preview';

    const state = invalid ? 'invalid' : 'default';

    return (
      <div
        data-state={state}
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-input bg-card text-card-foreground shadow-sm',
          state === 'invalid' && 'border-destructive',
          disabled && 'opacity-60',
          className,
        )}
        style={{ minHeight }}
      >
        <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
          <div role="toolbar" aria-label="Markdown formatting" className="flex items-center gap-0.5">
            {ACTIONS.map((a) => (
              <button
                key={a.key}
                type="button"
                aria-label={a.label}
                disabled={disabled || readOnly}
                onClick={() => applyAction(a)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                {a.icon}
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="View mode" className="ml-auto flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border">
            {(['edit', 'split', 'preview'] as MarkdownEditorView[]).map((v) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={view === v}
                onClick={() => setView(v)}
                className={cn(
                  'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
                  view === v
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-1 divide-x divide-border" style={{ minHeight: 0 }}>
          {showEdit && (
            <textarea
              {...rest}
              ref={textareaRef}
              id={groupId}
              value={value}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              spellCheck={false}
              aria-invalid={invalid || undefined}
              onChange={(e) => setValue(e.target.value)}
              className={cn(
                'flex-1 resize-none whitespace-pre-wrap break-words bg-transparent p-3 font-mono text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed',
                showPreview && 'border-r-0',
              )}
            />
          )}
          {showPreview && (
            <div
              aria-live="polite"
              aria-label="Preview"
              className="prose prose-sm flex-1 overflow-auto bg-background p-3 text-sm text-foreground"
            >
              {renderPreview ? (
                renderPreview(value)
              ) : (
                <div dangerouslySetInnerHTML={{ __html: previewHtml ?? '' }} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

