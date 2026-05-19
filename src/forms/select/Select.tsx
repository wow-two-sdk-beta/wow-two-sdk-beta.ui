import {
  createContext,
  forwardRef,
  isValidElement,
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
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import {
  Listbox,
  ListboxItem,
  ListboxGroup,
  ListboxSeparator,
  ListboxEmpty,
  type EqualityFn,
} from '../listbox';
import { SearchInput } from '../searchInput';
import { selectTriggerVariants, type SelectTriggerVariants } from './Select.variants';

/* Default equality: Object.is. */
const defaultEquals: EqualityFn<unknown> = (a, b) => Object.is(a, b);

interface ItemRegistryEntry {
  value: unknown;
  label: ReactNode;
  text: string;
}

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: unknown;
  hasValue: boolean;
  onSelect: (value: unknown) => void;
  onClear: () => void;
  isEqual: EqualityFn<unknown>;
  items: ItemRegistryEntry[];
  registerItem: (entry: ItemRegistryEntry) => void;
  unregisterItem: (value: unknown) => void;
  query: string;
  setQuery: (q: string) => void;
  disabled: boolean;
  isLoading: boolean;
  clearable: boolean;
  serialize: (value: unknown) => string;
  name?: string;
  invalid?: boolean;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select.* must be used inside <Select>');
  return ctx;
}

export interface SelectProps<T = string> {
  /** `T` = selected value · `null` = explicitly cleared · `undefined` = uncontrolled. */
  value?: T | null;
  defaultValue?: T | null;
  onValueChange?: (value: T | null) => void;
  /** Custom equality. Default: `Object.is`. */
  isEqual?: EqualityFn<T>;
  disabled?: boolean;
  /** Show a small spinner in the trigger and block interaction. */
  isLoading?: boolean;
  /** Render a clear (×) button in the trigger when a value is set. */
  clearable?: boolean;
  /** Hidden form-input name. Value is stringified via `serialize`. */
  name?: string;
  /** Stringify value for the hidden form input. Default: `String(value)`. */
  serialize?: (value: T) => string;
  /** Style trigger as invalid (red border, error ring). */
  invalid?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Floating placement of the dropdown. */
  placement?: React.ComponentProps<typeof Popover>['placement'];
  children: ReactNode;
}

function SelectImpl<T = string>({
  value,
  defaultValue,
  onValueChange,
  isEqual,
  disabled = false,
  isLoading = false,
  clearable = false,
  name,
  serialize,
  invalid,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  placement = 'bottom',
  children,
}: SelectProps<T>): ReactElement {
  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [valueState, setValueState] = useControlled<T | null>({
    controlled: value,
    default: defaultValue ?? null,
    onChange: onValueChange,
  });
  const [items, setItems] = useState<ItemRegistryEntry[]>([]);
  const [query, setQuery] = useState('');

  /* Ref-stabilise consumer fns so they don't churn `useMemo` deps when passed inline. */
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;
  const serializeRef = useRef(serialize);
  serializeRef.current = serialize;

  const equals = useCallback<EqualityFn<unknown>>((a, b) => {
    const fn = isEqualRef.current as EqualityFn<unknown> | undefined;
    return (fn ?? defaultEquals)(a, b);
  }, []);
  const serializer = useCallback((v: unknown) => {
    const fn = serializeRef.current as ((v: unknown) => string) | undefined;
    return (fn ?? ((x) => String(x)))(v);
  }, []);

  const registerItem = useCallback((entry: ItemRegistryEntry) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => Object.is(p.value, entry.value));
      if (idx >= 0) {
        const existing = prev[idx];
        if (existing && existing.label === entry.label && existing.text === entry.text) {
          return prev;
        }
        const next = prev.slice();
        next[idx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }, []);

  const unregisterItem = useCallback((v: unknown) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => Object.is(p.value, v));
      if (idx === -1) return prev;
      const next = prev.slice();
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const onSelect = useCallback(
    (next: unknown) => {
      (setValueState as (v: unknown) => void)(next);
      setOpenState(false);
      setQuery('');
    },
    [setValueState, setOpenState],
  );

  const onClear = useCallback(() => {
    (setValueState as (v: unknown) => void)(null);
  }, [setValueState]);

  const hasValue = valueState !== null && valueState !== undefined;

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      value: valueState,
      hasValue,
      onSelect,
      onClear,
      isEqual: equals,
      items,
      registerItem,
      unregisterItem,
      query,
      setQuery,
      disabled,
      isLoading,
      clearable,
      serialize: serializer,
      name,
      invalid,
    }),
    [
      openState,
      setOpenState,
      valueState,
      hasValue,
      onSelect,
      onClear,
      equals,
      items,
      registerItem,
      unregisterItem,
      query,
      disabled,
      isLoading,
      clearable,
      serializer,
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
        offset={6}
      >
        {children}
      </Popover>
    </SelectContext.Provider>
  );
}

const Select = SelectImpl as (<T = string>(props: SelectProps<T>) => ReactElement) & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ size, state, className, children, ...rest }, ref) {
    const ctx = useSelectContext();
    const triggerState = state ?? (ctx.invalid ? 'invalid' : 'default');
    const showClear = ctx.clearable && ctx.hasValue && !ctx.isLoading && !ctx.disabled;
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
          <span className="ml-auto flex items-center gap-1">
            {showClear && (
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
                className="grid h-4 w-4 place-items-center rounded-sm text-subtle-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            {ctx.isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-subtle-foreground" />
            ) : (
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform',
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

export interface SelectValueProps {
  /** Shown when nothing is selected. */
  placeholder?: ReactNode;
  /** Optional explicit override. */
  children?: ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const ctx = useSelectContext();
  if (children) return <span className="truncate">{children}</span>;
  const match = ctx.hasValue
    ? ctx.items.find((i) => ctx.isEqual(i.value, ctx.value))
    : undefined;
  const label = match?.label ?? (ctx.hasValue ? ctx.serialize(ctx.value) : null);
  return (
    <span className={cn('truncate text-left', !label && 'text-subtle-foreground')}>
      {label ?? placeholder}
    </span>
  );
}

export interface SelectContentProps {
  className?: string;
  /** Render a search input above the items; filters by item label text. */
  searchable?: boolean;
  /** Placeholder for the search input. Default: "Search…". */
  searchPlaceholder?: string;
  /** Text shown when search yields no matches. Default: "No results". */
  noResultsLabel?: ReactNode;
  children: ReactNode;
}

export function SelectContent({
  className,
  searchable = false,
  searchPlaceholder = 'Search…',
  noResultsLabel = 'No results',
  children,
}: SelectContentProps) {
  const ctx = useSelectContext();
  const hasItems = ctx.items.length > 0;
  const visibleCount = ctx.query
    ? ctx.items.filter((i) => i.text.toLowerCase().includes(ctx.query.toLowerCase())).length
    : ctx.items.length;
  const showEmpty = hasItems && visibleCount === 0;

  return (
    <PopoverContent bare>
      <div
        className={cn('min-w-[var(--anchor-width)] overflow-hidden rounded-md', className)}
      >
        {searchable && (
          <div className="border-b border-border bg-popover p-1">
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
          value={ctx.value ?? undefined}
          onValueChange={(v) => {
            if (v !== null && v !== undefined) ctx.onSelect(v);
          }}
          isEqual={ctx.isEqual}
          className="border-0 shadow-none rounded-none"
        >
          {children}
          {showEmpty && <ListboxEmpty>{noResultsLabel}</ListboxEmpty>}
        </Listbox>
        {ctx.name && ctx.hasValue && (
          <input type="hidden" name={ctx.name} value={ctx.serialize(ctx.value)} />
        )}
      </div>
    </PopoverContent>
  );
}

/* Recursively pull a string out of a ReactNode for search-filter matching. */
function extractText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return extractText(props.children);
  }
  return '';
}

export interface SelectItemProps {
  value: unknown;
  disabled?: boolean;
  /** Override the searchable text (defaults to extracting from children). */
  text?: string;
  className?: string;
  children: ReactNode;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  { value, disabled, text, className, children },
  ref,
) {
  const ctx = useSelectContext();
  /* Destructure the stable useCallback refs from ctx so the effect deps don't churn
     when ctx is rebuilt by items-state updates. Without this we re-enter the
     effect every items change → unregister+register → new items → infinite loop. */
  const { registerItem, unregisterItem, query } = ctx;
  const itemText = useMemo(
    () => text ?? extractText(children),
    [text, children],
  );

  useEffect(() => {
    registerItem({ value, label: children, text: itemText });
    return () => unregisterItem(value);
  }, [registerItem, unregisterItem, value, children, itemText]);

  const matchesQuery =
    !query || itemText.toLowerCase().includes(query.toLowerCase());
  if (!matchesQuery) return null;

  return (
    <ListboxItem ref={ref} value={value} disabled={disabled} className={className}>
      {children}
    </ListboxItem>
  );
});

Select.Trigger = SelectTrigger;
Select.Value = SelectValue;
Select.Content = SelectContent;
Select.Item = SelectItem;
Select.Group = ListboxGroup;
Select.Separator = ListboxSeparator;
Select.Empty = ListboxEmpty;

export { Select };
export default Select;
