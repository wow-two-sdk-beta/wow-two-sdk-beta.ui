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
  type KeyboardEvent,
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
import { useControlled, useId, useTypeahead } from '../../hooks';
import { useFormControl } from '../../primitives/formControlContext/FormControlContext';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import { Announce } from '../../primitives';
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
  isDisabled?: boolean;
}

/** Represents an internal item-registry entry — option + plain-text for substring search. */
interface ItemRegistryEntry<K, V> {
  itemKey: K;
  value: V;
  label: ReactNode;
  text: string;
  /** Mirrors the item's disabled state so closed-trigger typeahead can skip it (the list skips via Listbox). */
  isDisabled: boolean;
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
  /** Resolves a label last seen for a key from the persistent cache (survives unmount). */
  getCachedLabel: (key: unknown) => ReactNode | undefined;
  query: string;
  setQuery: (q: string) => void;
  isDisabled: boolean;
  isLoading: boolean;
  loadingLabel: string;
  isClearable: boolean;
  clearLabel: string;
  serializeKey: (key: unknown) => string;
  getOptionLabel?: (key: unknown) => ReactNode;
  name?: string;
  isInvalid: boolean;
  /** Stable id of the inner Listbox — wired to the trigger's `aria-controls`. */
  listboxId: string;
  /** Reflects the listbox's active option id for `aria-activedescendant`. */
  activeDescendant: string | null;
  setActiveDescendant: (id: string | null) => void;
  /** Holds the DOM node of the inner Listbox — keyboard bridge re-dispatches onto it. */
  listboxRef: React.MutableRefObject<HTMLDivElement | null>;
  /** Form-control wiring inherited from a surrounding `<FormField>` (null when standalone). */
  fieldId?: string;
  labelId?: string;
  describedBy?: string;
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
  isDisabled?: boolean;
  /** Shows a spinner in the trigger and blocks interaction. */
  isLoading?: boolean;
  /** Labels the loading state for the polite live region + in-list row; defaults to `'Loading options…'`. */
  loadingLabel?: string;
  /** Renders a clear (×) button in the trigger when a value is set. */
  isClearable?: boolean;
  /** Labels the clear (×) button for assistive tech; defaults to `'Clear selection'`. */
  clearLabel?: string;
  /** Names the hidden form input that ships the serialized key. */
  name?: string;
  /** Serializes the key for the hidden form input; defaults to `String(key)`. */
  serializeKey?: (key: K) => string;
  /** Resolves a human label for a `value`/`defaultValue` before items register
   *  (the trigger otherwise shows the raw serialized key until the first open). */
  getOptionLabel?: (key: K) => ReactNode;
  /** Styles the trigger as invalid (red border, error ring). */
  isInvalid?: boolean;
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
  isDisabled,
  isLoading = false,
  loadingLabel = 'Loading options…',
  isClearable = false,
  clearLabel = 'Clear selection',
  name,
  serializeKey,
  getOptionLabel,
  isInvalid,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  placement = 'bottom',
  children,
}: SelectProps<K, V>): ReactElement {
  /* Inherits id/disabled/required/invalid/describedby from a surrounding <FormField>;
     standalone props win when provided, context fills the gaps. */
  const field = useFormControl();
  const finalDisabled = (isDisabled ?? field?.isDisabled) ?? false;
  const finalInvalid = (isInvalid ?? field?.isInvalid) ?? false;

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
  /* Persistent key→label cache (keyed by serialized key), never evicted on unmount: backstops
     label resolution for a closed trigger after items unmount, separate from the live `items` set. */
  const labelCacheRef = useRef<Map<string, ReactNode>>(new Map());
  const [query, setQuery] = useState('');
  const [activeDescendant, setActiveDescendant] = useState<string | null>(null);
  const generatedListboxId = useId('select-listbox');
  const listboxRef = useRef<HTMLDivElement | null>(null);
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
  const getOptionLabelRef = useRef(getOptionLabel);
  getOptionLabelRef.current = getOptionLabel;
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

  const getOptionLabelFn = useCallback((k: unknown): ReactNode => {
    const fn = getOptionLabelRef.current as ((k: unknown) => ReactNode) | undefined;
    return fn ? fn(k) : null;
  }, []);

  const registerItem = useCallback(
    (entry: ItemRegistryEntry<unknown, unknown>) => {
      /* Persist the label so a closed trigger can still resolve it after this item unmounts. */
      labelCacheRef.current.set(serializeKeyFn(entry.itemKey), entry.label);
      setItems((prev) => {
        const idx = prev.findIndex((p) => Object.is(p.itemKey, entry.itemKey));
        if (idx >= 0) {
          const existing = prev[idx];
          if (
            existing &&
            existing.label === entry.label &&
            existing.text === entry.text &&
            existing.isDisabled === entry.isDisabled &&
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
    [serializeKeyFn],
  );

  /* Drops the item from the live mounted set on unmount so a removed option (popover close OR
     option-set change) no longer satisfies search / typeahead / value resolution. The label
     stays in `labelCacheRef`, so the trigger keeps its label after close. */
  const unregisterItem = useCallback((k: unknown) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => Object.is(p.itemKey, k));
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const getCachedLabel = useCallback(
    (k: unknown): ReactNode | undefined => labelCacheRef.current.get(serializeKeyFn(k)),
    [serializeKeyFn],
  );

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
      getCachedLabel,
      query,
      setQuery,
      isDisabled: finalDisabled,
      isLoading,
      loadingLabel,
      isClearable,
      clearLabel,
      serializeKey: serializeKeyFn,
      getOptionLabel: getOptionLabelFn,
      name,
      isInvalid: finalInvalid,
      listboxId: generatedListboxId,
      activeDescendant,
      setActiveDescendant,
      listboxRef,
      fieldId: field?.id,
      labelId: field?.labelId,
      describedBy: field ? `${field.helperId} ${field.errorId}` : undefined,
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
      getCachedLabel,
      query,
      finalDisabled,
      isLoading,
      loadingLabel,
      isClearable,
      clearLabel,
      serializeKeyFn,
      getOptionLabelFn,
      name,
      finalInvalid,
      generatedListboxId,
      activeDescendant,
      field,
    ],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <Popover
        open={openState}
        onOpenChange={(o) => {
          setOpenState(o);
          if (!o) {
            setQuery('');
            setActiveDescendant(null);
          }
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

/** Contains the clear-button hit-box Tailwind classes per trigger size.
 *  The visual glyph stays small; the hit target is floored at 24×24 (WCAG 2.2 SC 2.5.8). */
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

/** Resolves the trigger's `data-state` — open wins, then loading/disabled/invalid. */
function triggerDataState(
  open: boolean,
  isLoading: boolean,
  isDisabled: boolean,
  isInvalid: boolean,
): string | undefined {
  if (open) return 'open';
  if (isLoading) return 'loading';
  if (isDisabled) return 'disabled';
  if (isInvalid) return 'invalid';
  return undefined;
}

/** Represents the prop surface of the `Select.Trigger`. */
export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger(
    { size, state, className, children, 'aria-label': ariaLabel, onKeyDown, ...rest },
    ref,
  ) {
    const ctx = useSelectContext();
    const triggerState = state ?? (ctx.isInvalid ? 'invalid' : 'default');

    /* Closed-only type-to-select (native `<select>`): typing picks the matching option without
       opening; while OPEN the inner Listbox owns typeahead. Matches each item's `entry.text`,
       anchored at the current selection so repeats cycle from there. */
    const triggerTypeahead = useTypeahead<ItemRegistryEntry<unknown, unknown>>({
      items: () => ctx.items,
      getLabel: (entry) => entry.text,
      isDisabled: (entry) => entry.isDisabled,
      getActiveIndex: () =>
        ctx.hasSelection
          ? ctx.items.findIndex((i) => ctx.keyEquals(i.itemKey, ctx.selectedKey))
          : -1,
      onMatch: (entry) => ctx.onSelect(entry),
      enabled: !ctx.open && !ctx.isDisabled && !ctx.isLoading,
    });

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      /* Only intercept when closed — open delegates to the Listbox. A consumed char (incl. Space
         while a buffer is active) must not also toggle the popover open via the button. */
      if (!ctx.open && triggerTypeahead.onKeyDown(event)) {
        event.preventDefault();
      }
    };
    const showClear =
      ctx.isClearable && ctx.hasSelection && !ctx.isLoading && !ctx.isDisabled;
    const sizeKey = size ?? 'md';
    const iconClass = TRIGGER_ICON_CLASSES[sizeKey];
    const clearBoxClass = TRIGGER_CLEAR_BOX_CLASSES[sizeKey];
    const dividerClass = TRIGGER_DIVIDER_CLASSES[sizeKey];
    const clearOffsetClass = TRIGGER_CLEAR_OFFSET_CLASSES[sizeKey];
    /* Names the trigger from the FormField label when present; an explicit aria-label always wins. */
    const labelledBy = !ariaLabel ? ctx.labelId : undefined;
    /* The clear control is a real sibling button overlaying a reserved slot — nesting an
       interactive role inside the trigger button is invalid ARIA and keyboard-unreachable. */
    return (
      <span className="relative inline-flex w-full">
        {/* Always-mounted polite live region — swapping children (empty ↔ label) makes SRs
            announce the loading transition. `aria-busy` on the button alone isn't announced. */}
        <Announce>{ctx.isLoading ? ctx.loadingLabel : ''}</Announce>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            id={ctx.fieldId}
            disabled={ctx.isDisabled || ctx.isLoading}
            aria-busy={ctx.isLoading || undefined}
            aria-haspopup="listbox"
            aria-controls={ctx.listboxId}
            aria-activedescendant={ctx.open ? ctx.activeDescendant ?? undefined : undefined}
            aria-invalid={triggerState === 'invalid' || undefined}
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-describedby={ctx.describedBy}
            data-state={triggerDataState(ctx.open, ctx.isLoading, ctx.isDisabled, ctx.isInvalid)}
            className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
            onKeyDown={handleTriggerKeyDown}
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
            aria-label={ctx.clearLabel}
            onClick={() => ctx.onClear()}
            /* `min-h/min-w` floor the hit target at 24px (WCAG 2.2 SC 2.5.8) while the
               glyph box (`clearBoxClass`) stays visually small. */
            className={cn(
              'absolute top-1/2 grid min-h-6 min-w-6 -translate-y-1/2 place-items-center rounded-full text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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
  /* Resolution order: live registry → label captured at selection → persistent cache (labels a
     closed trigger post-unmount) → `getOptionLabel` (human label before first open) → serialized key. */
  const label =
    match?.label ??
    ctx.selectedLabel ??
    (ctx.hasSelection ? ctx.getCachedLabel(ctx.selectedKey) : null) ??
    (ctx.hasSelection ? ctx.getOptionLabel?.(ctx.selectedKey) : null) ??
    (ctx.hasSelection ? ctx.serializeKey(ctx.selectedKey) : null);
  return (
    <span className={cn('truncate text-left', !label && 'text-subtle-foreground')}>
      {label ?? placeholder}
    </span>
  );
}

/* ────────── Content ────────── */

/** The navigation keys the search input forwards to the Listbox keyboard handler. */
const FORWARDED_NAV_KEYS = new Set(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp', 'Enter']);

/** Represents the prop surface of the `Select.Content`. */
export interface SelectContentProps extends SurfaceVariants {
  className?: string;
  /** Renders a search input above the items and filters by label substring. */
  isSearchable?: boolean;
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
  isSearchable = false,
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

  /* Bridges nav keys from the search input to the Listbox by re-dispatching a bubbling
     KeyboardEvent onto the listbox node; printable chars stay in the input for filtering. The
     active-id change is mirrored back via the Listbox's `onActiveChange` after commit. */
  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        /* Let the popover's DismissableLayer close + restore focus to the trigger. */
        return;
      }
      if (!FORWARDED_NAV_KEYS.has(event.key)) return;
      const node = ctx.listboxRef.current;
      if (!node) return;
      event.preventDefault();
      node.dispatchEvent(
        new KeyboardEvent('keydown', { key: event.key, bubbles: true, cancelable: true }),
      );
    },
    [ctx.listboxRef],
  );

  return (
    <PopoverContent
      variant={variant}
      tone={tone}
      radius={radius}
      padding={padding ?? 'none'}
      elevation={elevation}
      className={cn(
        'overflow-hidden',
        /* Truncate the option's first content child (the label) so trailing meta stays visible.
           Targets Listbox.Item's stable `data-listbox-item-content` wrapper rather than a deep
           `[role=option]>span.flex-1>:first-child` chain that breaks if the markup shifts. */
        matchWidth
          ? 'w-(--anchor-width) [&_[data-listbox-item-content]>:first-child]:truncate'
          : 'w-auto min-w-(--anchor-width)',
        className,
      )}
    >
      {isSearchable && (
        <div className="border-b border-border p-1">
          <SearchInput
            size="sm"
            autoFocus
            role="combobox"
            aria-expanded
            aria-controls={ctx.listboxId}
            aria-activedescendant={ctx.activeDescendant ?? undefined}
            aria-autocomplete="list"
            value={ctx.query}
            onChange={(e) => ctx.setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
            isClearable
            onClear={() => ctx.setQuery('')}
            className="rounded-sm"
          />
        </div>
      )}
      <Listbox<unknown>
        ref={ctx.listboxRef}
        id={ctx.listboxId}
        /* In searchable mode focus stays on the input; the listbox must not steal it
           into the focus order — the input is the combobox, the listbox follows. */
        tabIndex={isSearchable ? -1 : 0}
        /* Mirror the active option onto the trigger/search `aria-activedescendant`. Fires after
           commit (incl. initial auto-active + every nav move), so no first-keypress lag or scrape race. */
        onActiveChange={ctx.setActiveDescendant}
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
        {/* In-list loading affordance — visible when options resolve asynchronously while the
            panel is open (e.g. a dependent re-fetch). Suppresses the no-results message so a
            mid-load empty set doesn't read as "no results". */}
        {ctx.isLoading && (
          <div
            role="status"
            className="flex items-center gap-2 px-2 py-2 text-sm text-subtle-foreground"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{ctx.loadingLabel}</span>
          </div>
        )}
        {children}
        {!ctx.isLoading && showEmpty && <ListboxEmpty>{noResultsLabel}</ListboxEmpty>}
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
  isDisabled?: boolean;
  className?: string;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { itemKey, value, label, children, text, isDisabled, className },
  ref,
) {
  const ctx = useSelectContext();
  const { registerItem, unregisterItem, query } = ctx;
  const resolvedValue = (value === undefined ? itemKey : value) as unknown;
  const itemText = useMemo(() => {
    /* `extractText` returns '' (never nullish) for unrenderable nodes, so `??` would never reach
       `children` — fall back explicitly when the label yields no text. Explicit `text` wins. */
    if (text !== undefined) return text;
    const fromLabel = extractText(label);
    return fromLabel !== '' ? fromLabel : extractText(children);
  }, [text, label, children]);

  /* Registers on mount, unregisters on unmount so a removed option leaves the live set (used by
     search / typeahead / value lookup). The label persists in the root's cache, so the trigger
     stays labelled after the popover closes and items unmount. */
  useEffect(() => {
    registerItem({ itemKey, value: resolvedValue, label, text: itemText, isDisabled: isDisabled ?? false });
    return () => unregisterItem(itemKey);
  }, [registerItem, unregisterItem, itemKey, resolvedValue, label, itemText, isDisabled]);

  const matchesQuery =
    !query || itemText.toLowerCase().includes(query.toLowerCase());
  if (!matchesQuery) return null;

  /* Listbox compares via the wired keyEquals — same equality math as Select. */
  return (
    <ListboxItem ref={ref} value={itemKey} isDisabled={isDisabled} className={className}>
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
