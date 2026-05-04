import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { ChevronRight, Copy } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';

export type JSONEditorMode = 'tree' | 'text';

export interface JSONEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: (value: unknown) => void;
  mode?: JSONEditorMode;
  defaultMode?: JSONEditorMode;
  onModeChange?: (mode: JSONEditorMode) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  indent?: number;
  minHeight?: string;
}

type Path = Array<string | number>;

function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function pathToString(path: Path): string {
  return path
    .map((p) => (typeof p === 'number' ? `[${p}]` : path.indexOf(p) === 0 ? p : `.${p}`))
    .join('');
}

function setAtPath(root: unknown, path: Path, next: unknown): unknown {
  if (path.length === 0) return next;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const idx = head as number;
    const copy = root.slice();
    copy[idx] = setAtPath(root[idx], rest, next);
    return copy;
  }
  if (root && typeof root === 'object') {
    const key = head as string;
    return { ...(root as Record<string, unknown>), [key]: setAtPath((root as Record<string, unknown>)[key], rest, next) };
  }
  return root;
}

/**
 * JSON editor with tree-view and raw-text modes. Tree mode supports inline
 * edit of primitive leaves + per-node copy-path. Text mode parses on commit;
 * invalid JSON shows inline error.
 */
export const JSONEditor = forwardRef<HTMLDivElement, JSONEditorProps>(function JSONEditor(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    mode: modeProp,
    defaultMode = 'tree',
    onModeChange,
    disabled,
    readOnly,
    invalid,
    indent = 2,
    minHeight = '14rem',
    className,
    ...rest
  },
  ref,
) {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? {},
    onChange: onValueChange,
  });
  const [mode, setMode] = useControlled({
    controlled: modeProp,
    default: defaultMode,
    onChange: onModeChange,
  });

  const updateAt = (path: Path, next: unknown) => {
    setValue(setAtPath(value, path, next));
  };

  return (
    <div
      ref={ref}
      data-state={invalid ? 'invalid' : 'default'}
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-input bg-card text-card-foreground shadow-sm',
        invalid && 'border-destructive',
        disabled && 'opacity-60',
        className,
      )}
      style={{ minHeight }}
      {...rest}
    >
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
        <div role="radiogroup" aria-label="JSON mode" className="flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border">
          {(['tree', 'text'] as JSONEditorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                'inline-flex h-6 items-center rounded px-2 text-xs font-medium transition-colors',
                mode === m
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto" style={{ minHeight: 0 }}>
        {mode === 'tree' ? (
          <TreeView value={value} updateAt={updateAt} disabled={disabled} readOnly={readOnly} />
        ) : (
          <TextView value={value} setValue={setValue} disabled={disabled} readOnly={readOnly} indent={indent} />
        )}
      </div>
    </div>
  );
});

interface TreeViewProps {
  value: unknown;
  updateAt: (path: Path, next: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

function TreeView({ value, updateAt, disabled, readOnly }: TreeViewProps) {
  return (
    <ul role="tree" className="font-mono text-sm">
      <TreeNode keyName={null} value={value} path={[]} updateAt={updateAt} disabled={disabled} readOnly={readOnly} depth={0} />
    </ul>
  );
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: unknown;
  path: Path;
  updateAt: (path: Path, next: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  depth: number;
}

function TreeNode({ keyName, value, path, updateAt, disabled, readOnly, depth }: TreeNodeProps) {
  const type = describeType(value);
  const isObject = type === 'object' || type === 'array';
  const [open, setOpen] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');

  const startEdit = () => {
    if (disabled || readOnly || isObject) return;
    setEditing(true);
    setDraft(typeof value === 'string' ? value : String(value));
  };

  const commitEdit = () => {
    setEditing(false);
    if (typeof value === 'number') {
      const n = Number(draft);
      if (!Number.isNaN(n)) updateAt(path, n);
    } else if (typeof value === 'boolean') {
      if (draft === 'true' || draft === 'false') updateAt(path, draft === 'true');
    } else if (value === null) {
      if (draft === 'null') updateAt(path, null);
    } else {
      updateAt(path, draft);
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setEditing(false);
  };

  const copyPath = () => {
    const text = pathToString(path);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  const entries = isObject
    ? Array.isArray(value)
      ? (value as unknown[]).map((v, i) => [i, v] as const)
      : Object.entries(value as Record<string, unknown>)
    : [];

  return (
    <li role="treeitem" aria-expanded={isObject ? open : undefined} className="px-1">
      <div className="group flex items-start gap-1 py-0.5" style={{ paddingLeft: depth * 16 }}>
        {isObject ? (
          <button
            type="button"
            aria-label={open ? 'Collapse' : 'Expand'}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Icon icon={ChevronRight} size={12} className={cn('transition-transform', open && 'rotate-90')} />
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}
        {keyName !== null && (
          <span className="text-foreground">
            {typeof keyName === 'string' ? `"${keyName}"` : keyName}
            <span className="text-muted-foreground">: </span>
          </span>
        )}
        {isObject ? (
          <span className="text-muted-foreground">
            {Array.isArray(value) ? `Array(${entries.length})` : `Object(${entries.length})`}
          </span>
        ) : editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={commitEdit}
            className="h-5 rounded-sm bg-background px-1 text-sm font-mono outline-none ring-2 ring-ring"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className={cn(
              'cursor-text rounded-sm px-1 text-left transition-colors',
              !disabled && !readOnly && 'hover:bg-muted',
              type === 'string' && 'text-info',
              type === 'number' && 'text-warning',
              type === 'boolean' && 'text-success',
              type === 'null' && 'text-muted-foreground italic',
            )}
          >
            {type === 'string' ? `"${value as string}"` : String(value)}
          </button>
        )}
        <button
          type="button"
          aria-label={`Copy path ${pathToString(path) || 'root'}`}
          onClick={copyPath}
          className="ml-auto opacity-0 transition-opacity group-hover:opacity-100 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon icon={Copy} size={11} />
        </button>
      </div>
      {isObject && open && (
        <ul role="group">
          {entries.map(([k, v]) => (
            <TreeNode
              key={String(k)}
              keyName={k}
              value={v}
              path={[...path, k]}
              updateAt={updateAt}
              disabled={disabled}
              readOnly={readOnly}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

interface TextViewProps {
  value: unknown;
  setValue: (next: unknown) => void;
  disabled?: boolean;
  readOnly?: boolean;
  indent: number;
}

function TextView({ value, setValue, disabled, readOnly, indent }: TextViewProps) {
  const initial = useMemo(() => safeStringify(value, indent), [value, indent]);
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);

  // Re-sync when external value changes (when not actively editing).
  useEffect(() => {
    if (!dirty.current) setDraft(initial);
  }, [initial]);

  const commit = () => {
    try {
      const parsed = JSON.parse(draft);
      setError(null);
      setValue(parsed);
      dirty.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <textarea
        value={draft}
        disabled={disabled}
        readOnly={readOnly}
        spellCheck={false}
        onChange={(e) => {
          dirty.current = true;
          setDraft(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(initial);
            setError(null);
            dirty.current = false;
          }
        }}
        className={cn(
          'flex-1 resize-none whitespace-pre bg-transparent p-3 font-mono text-sm outline-none placeholder:text-subtle-foreground disabled:cursor-not-allowed',
          error && 'text-foreground',
        )}
      />
      {error && (
        <div role="alert" className="border-t border-destructive bg-destructive-soft px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}

function safeStringify(value: unknown, indent: number): string {
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return '';
  }
}
