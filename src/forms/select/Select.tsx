import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ChevronDown, X, Loader2 } from 'lucide-react';
import {
  cn,
  Equality,
  type EqualityComparer,
  type SurfaceVariants,
} from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import {
  Listbox,
  ListboxItem,
  ListboxGroup,
  ListboxSeparator,
  ListboxEmpty,
} from '../listbox';
import { SearchInput } from '../searchInput';
import { selectTriggerVariants, type SelectTriggerVariants } from './Select.variants';

/* ────────── Option model ────────── */

/**
 * The three coordinates of a single dropdown option:
 *   - `itemKey` — uniquely identifies the option (used for equality + indexing).
 *   - `value`   — the rich payload returned to the consumer on selection.
 *   - `label`   — what's shown in the trigger when this option is selected.
 *
 * Defaults: `V = K` (key === value when no rich payload needed).
 */
export interface SelectOption<K, V = K> {
  itemKey: K;
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

/* Internal item-registry entry — same shape but tracks searchable text too. */
interface ItemRegistryEntry<K, V> {
  itemKey: K;
  value: V;
  label: ReactNode;
  /** Plain-text representation for substring search filtering. */
  text: string;
}

/* ────────── Context ────────── */

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedKey: unknown;
  hasSelection: boolean;
  onSelect: (entry: ItemRegistryEntry<unknown, unknown>) => void;
  onClear: () => void;
  keyEquals: EqualityComparer<unknown>;
  items: Array<ItemRegistryEntry<unknown, unknown>>;
  registerItem: (entry: ItemRegistryEntry<unknown, unknown>) => void;
  unregisterItem: (itemKey: unknown) => void;
  query: string;
  setQuery: (q: string) => void;
  disabled: boolean;
  isLoading: boolean;
  clearable: boolean;
  serializeKey: (key: unknown) => string;
  name?: string;
  invalid?: boolean;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select.* must be used inside <Select>');
  return ctx;
}

/* ────────── Root ────────── */

export interface SelectProps<K, V = K> {
  /** Selected key. `null` = explicit clear. `undefined` = uncontrolled. */
  selected?: K | null;
  defaultSelected?: K | null;
  /** Fires when an item is picked or cleared. `null` for the cleared case. */
  onChange?: (selected: SelectOption<K, V> | null) => void;
  /** Key equality. Default: `Equality.strict` (Object.is — fine for string/number/boolean). */
  keyEquals?: EqualityComparer<K>;
  disabled?: boolean;
  /** Spinner in trigger + interactions blocked. */
  isLoading?: boolean;
  /** Renders a clear (×) button in the trigger when a value is set. */
  clearable?: boolean;
  /** Hidden form-input name. Value is the serialized selected key. */
  name?: string;
  /** Stringify the key for hidden form input. Default: `String(key)`. */
  serializeKey?: (key: K) => string;
  /** Style trigger as invalid (red border, error ring). */
  invalid?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Floating placement. */
  placement?: React.ComponentProps<typeof Popover>['placement'];
  children: ReactNode;
}

function SelectImpl<K, V = K>({
  selected,
  defaultSelected,
  onChange,
  keyEquals,
  disabled = false,
  isLoading = false,
  clearable = false,
  name,
  serializeKey,
  invalid,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  placement = 'bottom',
  children,
}: SelectProps<K, V>): ReactElement {
  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [keyState, setKeyState] = useControlled<K | null>({
    controlled: selected,
    default: defaultSelected ?? null,
    onChange: undefined, // we emit via onChange below — needs both key + value
  });
  const [items, setItems] = useState<Array<ItemRegistryEntry<unknown, unknown>>>([]);
  const [query, setQuery] = useState('');

  /* Ref-stabilise consumer fns so they don't churn `useMemo` deps. */
  const keyEqualsRef = useRef(keyEquals);
  keyEqualsRef.current = keyEquals;
  const serializeKeyRef = useRef(serializeKey);
  serializeKeyRef.current = serializeKey;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const keyEqualsFn = useCallback<EqualityComparer<unknown>>((a, b) => {
    const fn = keyEqualsRef.current as EqualityComparer<unknown> | undefined;
    return (fn ?? Equality.strict)(a, b);
  }, []);

  const serializeKeyFn = useCallback((k: unknown) => {
    const fn = serializeKeyRef.current as ((k: unknown) => string) | undefined;
    return (fn ?? ((x) => String(x)))(k);
  }, []);

  const registerItem = useCallback(
    (entry: ItemRegistryEntry<unknown, unknown>) => {
      setItems((prev) => {
        const idx = prev.findIndex((p) => Object.is(p.itemKey, entry.itemKey));
        if (idx >= 0) {
          const existing = prev[idx];
          if (
            existing &&
            existing.label === entry.label &&
            existing.text === entry.text &&
            Object.is(existing.value, entry.value)
          ) {
            return prev;
          }
          const next = prev.slice();
          next[idx] = entry;
          return next;
        }
        return [...prev, entry];
      });
    },
    [],
  );

  const unregisterItem = useCallback((k: unknown) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => Object.is(p.itemKey, k));
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const emitChange = useCallback(
    (next: SelectOption<K, V> | null) => {
      onChangeRef.current?.(next);
    },
    [],
  );

  const onSelect = useCallback(
    (entry: ItemRegistryEntry<unknown, unknown>) => {
      (setKeyState as (v: unknown) => void)(entry.itemKey);
      setOpenState(false);
      setQuery('');
      emitChange({
        itemKey: entry.itemKey as K,
        value: entry.value as V,
        label: entry.label,
      });
    },
    [setKeyState, setOpenState, emitChange],
  );

  const onClear = useCallback(() => {
    (setKeyState as (v: unknown) => void)(null);
    emitChange(null);
  }, [setKeyState, emitChange]);

  const hasSelection = keyState !== null && keyState !== undefined;

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      selectedKey: keyState,
      hasSelection,
      onSelect,
      onClear,
      keyEquals: keyEqualsFn,
      items,
      registerItem,
      unregisterItem,
      query,
      setQuery,
      disabled,
      isLoading,
      clearable,
      serializeKey: serializeKeyFn,
      name,
      invalid,
    }),
    [
      openState,
      setOpenState,
      keyState,
      hasSelection,
      onSelect,
      onClear,
      keyEqualsFn,
      items,
      registerItem,
      unregisterItem,
      query,
      disabled,
      isLoading,
      clearable,
      serializeKeyFn,
      name,
      invalid,
    ],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <Popover
        open={openState}
        onOpenChange={(o) => {
          setOpenState(o);
          if (!o) setQuery('');
        }}
        placement={placement}
        offset={4}
      >
        {children}
      </Popover>
    </SelectContext.Provider>
  );
}

const Select = SelectImpl as (<K, V = K>(props: SelectProps<K, V>) => ReactElement) & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

/* ────────── Trigger ────────── */

/* Icon dimensions scale with trigger size. */
const TRIGGER_ICON_CLASSES = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

/* Clear-button hit-box dimensions per size. Slightly bigger than the icon. */
const TRIGGER_CLEAR_BOX_CLASSES = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

/* Vertical divider height between clear and chevron, per size. */
const TRIGGER_DIVIDER_CLASSES = {
  xs: 'h-3',
  sm: 'h-3.5',
  md: 'h-4',
  lg: 'h-5',
} as const;

export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ size, state, className, children, ...rest }, ref) {
    const ctx = useSelectContext();
    const triggerState = state ?? (ctx.invalid ? 'invalid' : 'default');
    const showClear =
      ctx.clearable && ctx.hasSelection && !ctx.isLoading && !ctx.disabled;
    const sizeKey = size ?? 'md';
    const iconClass = TRIGGER_ICON_CLASSES[sizeKey];
    const clearBoxClass = TRIGGER_CLEAR_BOX_CLASSES[sizeKey];
    const dividerClass = TRIGGER_DIVIDER_CLASSES[sizeKey];
    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={ctx.disabled || ctx.isLoading}
          aria-busy={ctx.isLoading || undefined}
          className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
          {...rest}
        >
          {children ?? <SelectValue />}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {showClear && (
              <>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Clear selection"
                  onClick={(e) => {
                    e.stopPropagation();
                    ctx.onClear();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      ctx.onClear();
                    }
                  }}
                  className={cn(
                    'grid place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground',
                    clearBoxClass,
                  )}
                >
                  <X className={iconClass} />
                </span>
                {/* Vertical divider separating clear from the chevron */}
                <span aria-hidden className={cn('w-px bg-border', dividerClass)} />
              </>
            )}
            {ctx.isLoading ? (
              <Loader2 className={cn(iconClass, 'animate-spin text-subtle-foreground')} />
            ) : (
              <ChevronDown
                className={cn(
                  iconClass,
                  'text-muted-foreground transition-transform',
                  ctx.open && 'rotate-180',
                )}
              />
            )}
          </span>
        </button>
      </PopoverTrigger>
    );
  },
);

/* ────────── Value (label inside trigger) ────────── */

export interface SelectValueProps {
  placeholder?: ReactNode;
  /** Explicit override (rendered as-is, no lookup). */
  children?: ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const ctx = useSelectContext();
  if (children) return <span className="truncate">{children}</span>;
  const match = ctx.hasSelection
    ? ctx.items.find((i) => ctx.keyEquals(i.itemKey, ctx.selectedKey))
    : undefined;
  const label =
    match?.label ?? (ctx.hasSelection ? ctx.serializeKey(ctx.selectedKey) : null);
  return (
    <span className={cn('truncate text-left', !label && 'text-subtle-foreground')}>
      {label ?? placeholder}
    </span>
  );
}

/* ────────── Content ────────── */

export interface SelectContentProps extends SurfaceVariants {
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  noResultsLabel?: ReactNode;
  /**
   * Lock surface width to the trigger's width. Long items truncate with `…`.
   * Default `false` — surface grows to fit the longest item.
   */
  matchWidth?: boolean;
  children: ReactNode;
}

export function SelectContent({
  className,
  searchable = false,
  searchPlaceholder = 'Search…',
  noResultsLabel = 'No results',
  matchWidth = false,
  variant,
  tone,
  radius,
  padding,
  elevation,
  children,
}: SelectContentProps) {
  const ctx = useSelectContext();
  const hasItems = ctx.items.length > 0;
  const visibleCount = ctx.query
    ? ctx.items.filter((i) => i.text.toLowerCase().includes(ctx.query.toLowerCase())).length
    : ctx.items.length;
  const showEmpty = hasItems && visibleCount === 0;

  return (
    <PopoverContent
      variant={variant}
      tone={tone}
      radius={radius}
      padding={padding ?? 'none'}
      elevation={elevation}
      className={cn(
        'overflow-hidden',
        matchWidth
          ? 'w-[var(--anchor-width)] [&_[role=option]>span.flex-1>:first-child]:truncate'
          : 'w-auto min-w-[var(--anchor-width)]',
        className,
      )}
    >
      {searchable && (
        <div className="border-b border-border p-1">
          <SearchInput
            size="sm"
            autoFocus
            value={ctx.query}
            onChange={(e) => ctx.setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            clearable
            onClear={() => ctx.setQuery('')}
            className="rounded-sm"
          />
        </div>
      )}
      <Listbox<unknown>
        value={ctx.selectedKey ?? undefined}
        onValueChange={(k) => {
          if (k === null || k === undefined) return;
          const entry = ctx.items.find((i) => ctx.keyEquals(i.itemKey, k));
          if (entry) ctx.onSelect(entry);
        }}
        isEqual={ctx.keyEquals}
        variant="flat"
        radius="none"
      >
        {children}
        {showEmpty && <ListboxEmpty>{noResultsLabel}</ListboxEmpty>}
      </Listbox>
      {ctx.name && ctx.hasSelection && (
        <input type="hidden" name={ctx.name} value={ctx.serializeKey(ctx.selectedKey)} />
      )}
    </PopoverContent>
  );
}

/* ────────── Item ────────── */

/* Recursively extract a plain-text representation of a ReactNode for search. */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return extractText(props?.children);
  }
  return '';
}

export interface SelectItemProps<K = unknown, V = K> {
  /** Unique key — drives equality, ARIA, search. */
  itemKey: K;
  /** Rich payload returned via `onChange`. Defaults to `itemKey` if omitted. */
  value?: V;
  /** Label shown in the trigger when this item is selected. */
  label: ReactNode;
  /** Optional in-list rendering. Falls back to `label` if not provided. */
  children?: ReactNode;
  /** Override the searchable text (defaults to the text content of `label`). */
  text?: string;
  disabled?: boolean;
  className?: string;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { itemKey, value, label, children, text, disabled, className },
  ref,
) {
  const ctx = useSelectContext();
  const { registerItem, unregisterItem, query } = ctx;
  const resolvedValue = (value === undefined ? itemKey : value) as unknown;
  const itemText = useMemo(
    () => text ?? extractText(label) ?? extractText(children),
    [text, label, children],
  );

  useEffect(() => {
    registerItem({ itemKey, value: resolvedValue, label, text: itemText });
    return () => unregisterItem(itemKey);
  }, [registerItem, unregisterItem, itemKey, resolvedValue, label, itemText]);

  const matchesQuery =
    !query || itemText.toLowerCase().includes(query.toLowerCase());
  if (!matchesQuery) return null;

  /* `<Listbox.Item value={itemKey}>` — Listbox compares by ctx.keyEquals which
     is wired to Select's keyEquals. So Listbox's internal equality math is the
     same as Select's key equality. */
  return (
    <ListboxItem ref={ref} value={itemKey} disabled={disabled} className={className}>
      {children ?? label}
    </ListboxItem>
  );
}) as <K, V = K>(props: SelectItemProps<K, V> & { ref?: React.Ref<HTMLDivElement> }) => ReactElement;

Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem as typeof SelectItem & ((props: SelectItemProps) => ReactElement);
Select.Group = ListboxGroup;
Select.Separator = ListboxSeparator;
Select.Empty = ListboxEmpty;

export { Select };
export default Select;
