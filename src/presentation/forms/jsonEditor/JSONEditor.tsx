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
import { cn } from '../../../foundation/utils';
import { useControlled } from '../../../foundation/hooks';
import { Icon } from '../../../foundation/icons';
import { useFormControl } from '../../../foundation/primitives/formControlContext/FormControlContext';

/** Defines how a JSON editor renders its document. */
export const JSONEditorMode = {
  /** Refers to the collapsible tree/structured view. */
  Tree: 'tree',
  /** Refers to the raw-text view. */
  Text: 'text',
} as const;

export type JSONEditorMode = (typeof JSONEditorMode)[keyof typeof JSONEditorMode];

export interface JSONEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  value?: unknown;
  defaultValue?: unknown;
  onValueChange?: (value: unknown) => void;
  mode?: JSONEditorMode;
  defaultMode?: JSONEditorMode;
  onModeChange?: (mode: JSONEditorMode) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
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
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : i === 0 ? p : `.${p}`))
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
    defaultMode = JSONEditorMode.Tree,
    onModeChange,
    isDisabled,
    isReadOnly,
    isInvalid,
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
  /* Inherits flags from a surrounding <Field>; explicit props win. The context id /
     labelling / describedby land on the active editing surface (text-mode textarea or
     tree-mode tree) — the subviews read the context themselves. */
  const ctx = useFormControl();
  const finalDisabled = isDisabled ?? ctx?.isDisabled;
  const finalReadOnly = isReadOnly ?? ctx?.isReadOnly;
  const finalInvalid = isInvalid ?? ctx?.isInvalid;

  const updateAt = (path: Path, next: unknown) => {
    setValue(setAtPath(value, path, next));
  };

  return (
    <div
      ref={ref}
      data-state={finalInvalid ? 'invalid' : 'default'}
      className={cn(
        'flex flex-col overflow-hidden rounded-md border border-input bg-card text-card-foreground shadow-sm',
        finalInvalid && 'border-destructive',
        finalDisabled && 'opacity-60',
        className,
      )}
      style={{ minHeight }}
      {...rest}
    >
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
        <div role="radiogroup" aria-label="JSON mode" className="flex items-center gap-0.5 rounded-md bg-card p-0.5 ring-1 ring-border">
          {Object.values(JSONEditorMode).map((m) => (
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
        {mode === JSONEditorMode.Tree ? (
          <TreeView value={value} updateAt={updateAt} isDisabled={finalDisabled} isReadOnly={finalReadOnly} isInvalid={finalInvalid} />
        ) : (
          <TextView value={value} setValue={setValue} isDisabled={finalDisabled} isReadOnly={finalReadOnly} isInvalid={finalInvalid} indent={indent} />
        )}
      </div>
    </div>
  );
});

interface TreeViewProps {
  value: unknown;
  updateAt: (path: Path, next: unknown) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
}

function TreeView({ value, updateAt, isDisabled, isReadOnly, isInvalid }: TreeViewProps) {
  /* In tree mode the tree IS the editing surface — it carries the context id
     (label anchor) and is named/described by the Field chrome. */
  const ctx = useFormControl();
  return (
    <ul
      role="tree"
      id={ctx?.id}
      aria-labelledby={ctx?.labelledBy}
      aria-describedby={ctx?.describedBy}
      aria-invalid={isInvalid || undefined}
      className="font-mono text-sm"
    >
      <TreeNode keyName={null} value={value} path={[]} updateAt={updateAt} isDisabled={isDisabled} isReadOnly={isReadOnly} isInvalid={isInvalid} depth={0} />
    </ul>
  );
}

interface TreeNodeProps {
  keyName: string | number | null;
  value: unknown;
  path: Path;
  updateAt: (path: Path, next: unknown) => void;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  depth: number;
}

function TreeNode({ keyName, value, path, updateAt, isDisabled, isReadOnly, isInvalid, depth }: TreeNodeProps) {
  /* The transient leaf editor is a real editing surface — the Field's helper/error
     description follows it (the input keeps its own action name). */
  const ctx = useFormControl();
  const type = describeType(value);
  const isObject = type === 'object' || type === 'array';
  const [open, setOpen] = useState(depth < 2);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');

  const startEdit = () => {
    if (isDisabled || isReadOnly || isObject) return;
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
            aria-label="Edit value"
            aria-invalid={isInvalid || undefined}
            aria-describedby={ctx?.describedBy}
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
              !isDisabled && !isReadOnly && 'hover:bg-muted',
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
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              isInvalid={isInvalid}
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
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
  indent: number;
}

function TextView({ value, setValue, isDisabled, isReadOnly, isInvalid, indent }: TextViewProps) {
  /* In text mode the raw textarea is the editing surface — it takes the context id
     (Label htmlFor target) and the Field label overrides the generic fallback name. */
  const ctx = useFormControl();
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
        id={ctx?.id}
        aria-label="JSON source"
        aria-labelledby={ctx?.labelledBy}
        aria-invalid={isInvalid || undefined}
        aria-describedby={ctx?.describedBy}
        value={draft}
        disabled={isDisabled}
        readOnly={isReadOnly}
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
