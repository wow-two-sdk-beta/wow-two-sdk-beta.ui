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

/** Represents a single dropdown option as `{ itemKey, value, label }` — V defaults to K. */
export interface SelectOption<K, V = K> {
  itemKey: K;
  value: V;
  label: ReactNode;
  disabled?: boolean;
}

/** Represents an internal item-registry entry — option + plain-text for substring search. */
interface ItemRegistryEntry<K, V> {
  itemKey: K;
  value: V;
  label: ReactNode;
  text: string;
}

/* ────────── Context ────────── */

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedKey: unknown;
  hasSelection: boolean;
  /** Holds the label captured at selection time — keeps the trigger labelled while the popover is closed. */
  selectedLabel: ReactNode;
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

/** Represents the prop surface of the `Select` root. */
export interface SelectProps<K, V = K> {
  /** Holds the selected key; `null` = explicit clear, `undefined` = uncontrolled. */
  value?: K | null;
  /** Holds the initial selected key for uncontrolled use. */
  defaultValue?: K | null;
  /** Fires when an item is picked or cleared (`null` on clear). */
  onValueChange?: (selected: SelectOption<K, V> | null) => void;
  /** Compares keys for equality; defaults to `Equality.strictEquals`. */
  keyEquals?: EqualityComparer<K>;
  /** Disables interaction when true. */
  disabled?: boolean;
  /** Shows a spinner in the trigger and blocks interaction. */
  isLoading?: boolean;
  /** Renders a clear (×) button in the trigger when a value is set. */
  clearable?: boolean;
  /** Names the hidden form input that ships the serialized key. */
  name?: string;
  /** Serializes the key for the hidden form input; defaults to `String(key)`. */
  serializeKey?: (key: K) => string;
  /** Styles the trigger as invalid (red border, error ring). */
  invalid?: boolean;
  /** Opens the dropdown initially when uncontrolled. */
  defaultOpen?: boolean;
  /** Controls the dropdown open state. */
  open?: boolean;
  /** Fires when the open state changes. */
  onOpenChange?: (open: boolean) => void;
  /** Sets the floating placement of the dropdown. */
  placement?: React.ComponentProps<typeof Popover>['placement'];
  children: ReactNode;
}

function SelectImpl<K, V = K>({
  value,
  defaultValue,
  onValueChange,
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
    controlled: value,
    default: defaultValue ?? null,
    /* Emits via `emitChange` below — needs both key + value, not just key. */
    onChange: undefined,
  });
  const [items, setItems] = useState<Array<ItemRegistryEntry<unknown, unknown>>>([]);
  const [query, setQuery] = useState('');
  /* Captures `{ itemKey, label }` at selection time — items unmount on popover close, so the
     registry alone can't label the trigger before the first open. */
  const [selectedEntry, setSelectedEntry] = useState<{
    itemKey: unknown;
    label: ReactNode;
  } | null>(null);

  /* Ref-stabilises consumer fns so they don't churn `useMemo` deps. */
  const keyEqualsRef = useRef(keyEquals);
  keyEqualsRef.current = keyEquals;
  const serializeKeyRef = useRef(serializeKey);
  serializeKeyRef.current = serializeKey;
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  const keyEqualsFn = useCallback<EqualityComparer<unknown>>((a, b) => {
    const fn = keyEqualsRef.current as EqualityComparer<unknown> | undefined;
    return (fn ?? Equality.strictEquals)(a, b);
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
      onValueChangeRef.current?.(next);
    },
    [],
  );

  const onSelect = useCallback(
    (entry: ItemRegistryEntry<unknown, unknown>) => {
      (setKeyState as (v: unknown) => void)(entry.itemKey);
      setSelectedEntry({ itemKey: entry.itemKey, label: entry.label });
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
    setSelectedEntry(null);
    emitChange(null);
  }, [setKeyState, emitChange]);

  const hasSelection = keyState !== null && keyState !== undefined;

  /* Drops the captured label when the key changed externally (controlled updates). */
  const selectedLabel =
    selectedEntry && hasSelection && keyEqualsFn(selectedEntry.itemKey, keyState)
      ? selectedEntry.label
      : null;

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      selectedKey: keyState,
      hasSelection,
      selectedLabel,
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
      selectedLabel,
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
        {/* Always-rendered — inside PopoverContent it would vanish from form submission when closed. */}
        {name && hasSelection && (
          <input type="hidden" name={name} value={serializeKeyFn(keyState)} />
        )}
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

/** Contains the icon Tailwind classes per trigger size. */
const TRIGGER_ICON_CLASSES = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

/** Contains the clear-button hit-box Tailwind classes per trigger size. */
const TRIGGER_CLEAR_BOX_CLASSES = {
  xs: 'h-4 w-4',
  sm: 'h-5 w-5',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
} as const;

/** Contains the vertical-divider height Tailwind classes per trigger size. */
const TRIGGER_DIVIDER_CLASSES = {
  xs: 'h-3',
  sm: 'h-3.5',
  md: 'h-4',
  lg: 'h-5',
} as const;

/** Contains the right-offset classes aligning the overlaid clear button with its reserved slot
 *  (trigger `px` + chevron width + `gap-1.5` + 1px divider + `gap-1.5`). */
const TRIGGER_CLEAR_OFFSET_CLASSES = {
  xs: 'right-[35px]',
  sm: 'right-[37px]',
  md: 'right-[41px]',
  lg: 'right-[49px]',
} as const;

/** Represents the prop surface of the `Select.Trigger`. */
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
    const clearOffsetClass = TRIGGER_CLEAR_OFFSET_CLASSES[sizeKey];
    /* The clear control is a real sibling button overlaying a reserved slot — nesting an
       interactive role inside the trigger button is invalid ARIA and keyboard-unreachable. */
    return (
      <span className="relative inline-flex w-full">
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
                  {/* Reserves the slot the overlaid clear button sits on. */}
                  <span aria-hidden className={clearBoxClass} />
                  {/* Separates the clear button from the chevron — `foreground/20` always contrasts. */}
                  <span aria-hidden className={cn('w-px bg-foreground/20', dividerClass)} />
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
        {showClear && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => ctx.onClear()}
            className={cn(
              'absolute top-1/2 grid -translate-y-1/2 place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              clearBoxClass,
              clearOffsetClass,
            )}
          >
            <X className={iconClass} />
          </button>
        )}
      </span>
    );
  },
);

/* ────────── Value (label inside trigger) ────────── */

/** Represents the prop surface of the `Select.Value`. */
export interface SelectValueProps {
  /** Shows when no item is selected. */
  placeholder?: ReactNode;
  /** Overrides the auto-resolved label (rendered as-is, no item lookup). */
  children?: ReactNode;
}

/** Provides the label shown inside the trigger for the currently selected item. */
export function SelectValue({ placeholder, children }: SelectValueProps) {
  const ctx = useSelectContext();
  if (children) return <span className="truncate">{children}</span>;
  const match = ctx.hasSelection
    ? ctx.items.find((i) => ctx.keyEquals(i.itemKey, ctx.selectedKey))
    : undefined;
  const label =
    match?.label ??
    ctx.selectedLabel ??
    (ctx.hasSelection ? ctx.serializeKey(ctx.selectedKey) : null);
  return (
    <span className={cn('truncate text-left', !label && 'text-subtle-foreground')}>
      {label ?? placeholder}
    </span>
  );
}

/* ────────── Content ────────── */

/** Represents the prop surface of the `Select.Content`. */
export interface SelectContentProps extends SurfaceVariants {
  className?: string;
  /** Renders a search input above the items and filters by label substring. */
  searchable?: boolean;
  /** Sets the placeholder of the search input. */
  searchPlaceholder?: string;
  /** Renders this label when the search yields no matches. */
  noResultsLabel?: ReactNode;
  /** Locks the surface width to the trigger's width and truncates long items. */
  matchWidth?: boolean;
  children: ReactNode;
}

/** Provides the floating panel that hosts the items below the trigger. */
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
          ? 'w-(--anchor-width) [&_[role=option]>span.flex-1>:first-child]:truncate'
          : 'w-auto min-w-(--anchor-width)',
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
    </PopoverContent>
  );
}

/* ────────── Item ────────── */

/** Provides a plain-text representation of a ReactNode for substring search. */
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

/** Represents the prop surface of the `Select.Item`. */
export interface SelectItemProps<K = unknown, V = K> {
  /** Identifies the item; drives equality, ARIA, and search. */
  itemKey: K;
  /** Holds the rich payload returned via `onValueChange`; defaults to `itemKey`. */
  value?: V;
  /** Shows in the trigger when this item is selected. */
  label: ReactNode;
  /** Overrides in-list rendering; falls back to `label` when omitted. */
  children?: ReactNode;
  /** Overrides the searchable text; defaults to the text content of `label`. */
  text?: string;
  /** Disables this item when true. */
  disabled?: boolean;
  className?: string;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { itemKey, value, label, children, text, disabled, className },
  ref,
) {
  const ctx = useSelectContext();
  const { registerItem, query } = ctx;
  const resolvedValue = (value === undefined ? itemKey : value) as unknown;
  const itemText = useMemo(
    () => text ?? extractText(label) ?? extractText(children),
    [text, label, children],
  );

  /* Registers only — never unregisters; items unmount on popover close and the trigger still needs the label. */
  useEffect(() => {
    registerItem({ itemKey, value: resolvedValue, label, text: itemText });
  }, [registerItem, itemKey, resolvedValue, label, itemText]);

  const matchesQuery =
    !query || itemText.toLowerCase().includes(query.toLowerCase());
  if (!matchesQuery) return null;

  /* Listbox compares via the wired keyEquals — same equality math as Select. */
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
