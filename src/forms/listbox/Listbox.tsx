import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Check } from 'lucide-react';
import { cn, surfaceVariants, type SurfaceVariants } from '../../utils';
import { useControlled, useTypeahead } from '../../hooks';
import {
  listboxEmptyVariants,
  listboxGroupLabelVariants,
  listboxItemVariants,
  listboxSeparatorVariants,
  listboxVariants,
} from './Listbox.variants';

/** Represents a function that matches items against the current selection. */
export type EqualityFn<T> = (a: T, b: T) => boolean;

/** Provides the default equality (Object.is) — primitives + reference equality. */
const defaultEquals: EqualityFn<unknown> = (a, b) => Object.is(a, b);

/** Represents the selection-indicator style applied to every item under this listbox. */
export type ListboxIndicator = 'check' | 'checkbox' | 'radio' | 'dot' | 'none';

/** Represents the per-item registry entry maintained by the listbox. */
interface ItemEntry {
  id: string;
  value: unknown;
  isDisabled: boolean;
}

/** Represents the shape of the listbox context shared with descendants. */
interface ListboxContextValue {
  isMultiple: boolean;
  values: unknown[];
  isEqual: EqualityFn<unknown>;
  activeId: string | null;
  onItemSelect: (value: unknown) => void;
  registerItem: (entry: ItemEntry) => void;
  unregisterItem: (id: string) => void;
  setActiveId: (id: string | null) => void;
  indicator: ListboxIndicator;
  isDisabled: boolean;
}

const ListboxContext = createContext<ListboxContextValue | null>(null);

function useListboxContext() {
  const ctx = useContext(ListboxContext);
  if (!ctx) throw new Error('Listbox.Item / Group / Separator must be used inside <Listbox>');
  return ctx;
}

type SingleProps<T> = {
  isMultiple?: false;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T | undefined) => void;
};

type MultiProps<T> = {
  isMultiple: true;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
};

/** Represents the props shared between single-select and multi-select modes. */
type CommonProps<T> = SurfaceVariants & {
  /** Disables all items when true. */
  isDisabled?: boolean;
  /** Compares item values for equality; defaults to `Object.is`. */
  isEqual?: EqualityFn<T>;
  /** Sets the selection-indicator style; default `check` (single) or `checkbox` (multi). */
  indicator?: ListboxIndicator;
  /** Fires after commit whenever the active (`aria-activedescendant`) option id changes —
   *  including the initial auto-active on mount. Lets a hosting combobox mirror the id without
   *  scraping the rendered DOM attribute. */
  onActiveChange?: (id: string | null) => void;
  className?: string;
  children: ReactNode;
};

export type ListboxProps<T = string> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> &
  (SingleProps<T> | MultiProps<T>) &
  CommonProps<T>;

function ListboxImpl<T>(
  props: ListboxProps<T>,
  ref: ForwardedRef<HTMLDivElement>,
): ReactElement {
  const {
    isMultiple = false,
    value,
    defaultValue,
    onValueChange,
    isEqual,
    indicator,
    onActiveChange,
    variant,
    tone,
    radius,
    padding,
    elevation,
    isDisabled,
    className,
    children,
    onKeyDown,
    ...rest
  } = props as ListboxProps<T> & {
    isMultiple?: boolean;
    value?: T | T[];
    defaultValue?: T | T[];
    onValueChange?: ((v: T | undefined) => void) | ((v: T[]) => void);
    onActiveChange?: (id: string | null) => void;
  };

  const equals = (isEqual as EqualityFn<unknown> | undefined) ?? defaultEquals;
  const resolvedIndicator: ListboxIndicator = indicator ?? (isMultiple ? 'checkbox' : 'check');

  const initial: T | T[] | undefined = defaultValue ?? (isMultiple ? ([] as T[]) : undefined);
  const [current, setCurrent] = useControlled<T | T[] | undefined>({
    controlled: value,
    default: initial,
    onChange: onValueChange as (v: T | T[] | undefined) => void,
  });

  const values: unknown[] = useMemo(() => {
    if (Array.isArray(current)) return current as unknown[];
    return current === undefined ? [] : [current];
  }, [current]);

  const items = useRef<ItemEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const registerItem = useCallback((entry: ItemEntry) => {
    const idx = items.current.findIndex((i) => i.id === entry.id);
    if (idx >= 0) items.current[idx] = entry;
    else items.current.push(entry);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    items.current = items.current.filter((i) => i.id !== id);
  }, []);

  const onItemSelect = useCallback(
    (next: unknown) => {
      if (isMultiple) {
        const cur = (Array.isArray(current) ? current : []) as unknown[];
        const has = cur.some((v) => equals(v, next));
        const out = has ? cur.filter((v) => !equals(v, next)) : [...cur, next];
        (setCurrent as (v: unknown[]) => void)(out);
      } else {
        (setCurrent as (v: unknown) => void)(next);
      }
    },
    [isMultiple, current, setCurrent, equals],
  );

  useEffect(() => {
    if (activeId) return;
    const firstSelected = items.current.find(
      (i) => !i.isDisabled && values.some((v) => equals(v, i.value)),
    );
    const firstEnabled = items.current.find((i) => !i.isDisabled);
    setActiveId((firstSelected ?? firstEnabled)?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mirrors the active id to a hosting combobox after commit. Ref-stabilised so swapping the
     handler doesn't re-fire; runs on every `activeId` change including the initial auto-active. */
  const onActiveChangeRef = useRef(onActiveChange);
  onActiveChangeRef.current = onActiveChange;
  useEffect(() => {
    onActiveChangeRef.current?.(activeId);
  }, [activeId]);

  /** Activates an option by id and keeps it visible (lists are `max-h-72 overflow-y-auto`). */
  const activateById = useCallback((id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ block: 'nearest' });
  }, []);

  const moveActive = useCallback(
    (direction: 1 | -1, jump = 1) => {
      const list = items.current.filter((i) => !i.isDisabled);
      if (list.length === 0) return;
      const currentIdx = list.findIndex((i) => i.id === activeId);
      let nextIdx = currentIdx + direction * jump;
      if (currentIdx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= list.length) nextIdx = list.length - 1;
      const nextEntry = list[nextIdx];
      if (nextEntry) activateById(nextEntry.id);
    },
    [activeId, activateById],
  );

  /* Type-to-select over the registered options. Labels are read from the live DOM text of each
     option (`document.getElementById` inside the user-event path → SSR-safe), so arbitrary
     `children` work without threading a label prop. Disabled options are skipped by the matcher. */
  const typeahead = useTypeahead<ItemEntry>({
    items: () => items.current,
    getLabel: (entry) => document.getElementById(entry.id)?.textContent ?? '',
    isDisabled: (entry) => entry.isDisabled,
    getActiveIndex: () => items.current.findIndex((i) => i.id === activeId),
    onMatch: (entry) => activateById(entry.id),
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || isDisabled) return;
      /* Type-to-select first: a printable char (incl. Space while a buffer is active) is consumed
         here and must not fall through to Enter/Space selection or anything else. */
      if (typeahead.onKeyDown(event)) {
        event.preventDefault();
        return;
      }
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          moveActive(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveActive(-1);
          break;
        case 'Home':
          event.preventDefault();
          moveActive(-1, items.current.length);
          break;
        case 'End':
          event.preventDefault();
          moveActive(1, items.current.length);
          break;
        case 'PageDown':
          event.preventDefault();
          moveActive(1, 10);
          break;
        case 'PageUp':
          event.preventDefault();
          moveActive(-1, 10);
          break;
        case 'Enter':
        case ' ': {
          if (!activeId) return;
          const entry = items.current.find((i) => i.id === activeId);
          if (!entry || entry.isDisabled) return;
          event.preventDefault();
          onItemSelect(entry.value);
          break;
        }
      }
    },
    [activeId, isDisabled, moveActive, onItemSelect, onKeyDown, typeahead],
  );

  const ctx = useMemo<ListboxContextValue>(
    () => ({
      isMultiple,
      values,
      isEqual: equals,
      activeId,
      onItemSelect,
      registerItem,
      unregisterItem,
      setActiveId,
      indicator: resolvedIndicator,
      isDisabled: isDisabled ?? false,
    }),
    [
      isMultiple,
      values,
      equals,
      activeId,
      onItemSelect,
      registerItem,
      unregisterItem,
      resolvedIndicator,
      isDisabled,
    ],
  );

  /* Default padding is `xs` (p-1) for items breathing room — overridable. */
  const resolvedPadding = padding ?? 'xs';

  return (
    <ListboxContext.Provider value={ctx}>
      <div
        ref={ref}
        role="listbox"
        tabIndex={isDisabled ? -1 : 0}
        aria-multiselectable={isMultiple || undefined}
        aria-activedescendant={activeId ?? undefined}
        aria-disabled={isDisabled || undefined}
        onKeyDown={handleKeyDown}
        className={cn(
          surfaceVariants({ variant, tone, radius, padding: resolvedPadding, elevation }),
          listboxVariants(),
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    </ListboxContext.Provider>
  );
}

const ListboxForwardRef = forwardRef(ListboxImpl) as <T = string>(
  props: ListboxProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;

/* ---------- Indicator visuals ---------- */

/** Provides the leading selection indicator (checkbox · radio · dot). */
function LeadingIndicator({
  indicator,
  isSelected,
}: {
  indicator: ListboxIndicator;
  isSelected: boolean;
}) {
  if (indicator === 'checkbox') {
    return (
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
          isSelected
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border',
        )}
      >
        {isSelected && <Check className="h-3 w-3" />}
      </span>
    );
  }
  if (indicator === 'radio') {
    return (
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          isSelected ? 'border-primary' : 'border-border',
        )}
      >
        {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
    );
  }
  if (indicator === 'dot') {
    return (
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 shrink-0 rounded-full',
          isSelected ? 'bg-primary' : 'bg-transparent',
        )}
      />
    );
  }
  return null;
}

/** Provides the trailing selection indicator (check icon). */
function TrailingIndicator({
  indicator,
  isSelected,
  isMultiple,
}: {
  indicator: ListboxIndicator;
  isSelected: boolean;
  isMultiple: boolean;
}) {
  if (indicator === 'check' && isSelected) {
    return <Check className={cn('h-4 w-4 shrink-0', !isMultiple && 'opacity-80')} />;
  }
  return null;
}

/* ---------- Item ---------- */

/** Represents the prop surface of `Listbox.Item`. */
export interface ListboxItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Holds the item value; compared via the parent listbox's `isEqual`. */
  value: unknown;
  /** Disables this item when true. */
  isDisabled?: boolean;
  /** Overrides the listbox-level indicator for this single item. */
  indicator?: ListboxIndicator;
  children: ReactNode;
}

export const ListboxItem = forwardRef<HTMLDivElement, ListboxItemProps>(function ListboxItem(
  { value, isDisabled = false, indicator: itemIndicator, className, children, onClick, onPointerEnter, ...rest },
  forwardedRef,
) {
  const ctx = useListboxContext();
  const id = useId();
  const ref = useRef<HTMLDivElement | null>(null);
  const indicator = itemIndicator ?? ctx.indicator;

  useEffect(() => {
    ctx.registerItem({ id, value, isDisabled });
    return () => ctx.unregisterItem(id);
  }, [ctx, id, value, isDisabled]);

  const isSelected = ctx.values.some((v) => ctx.isEqual(v, value));
  const isActive = ctx.activeId === id;
  const state = isDisabled
    ? 'disabled'
    : isSelected
      ? 'selected'
      : isActive
        ? 'active'
        : 'default';

  const setRefs = (node: HTMLDivElement | null) => {
    ref.current = node;
    if (typeof forwardedRef === 'function') forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  return (
    <div
      ref={setRefs}
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled || undefined}
      data-active={isActive ? '' : undefined}
      data-selected={isSelected ? '' : undefined}
      data-disabled={isDisabled ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        /* `ctx.isDisabled` = listbox-level disabled — keyboard is blocked in handleKeyDown; mirror for mouse. */
        if (e.defaultPrevented || isDisabled || ctx.isDisabled) return;
        ctx.onItemSelect(value);
      }}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        if (!isDisabled) ctx.setActiveId(id);
      }}
      className={cn(listboxItemVariants({ state }), className)}
      {...rest}
    >
      <LeadingIndicator indicator={indicator} isSelected={isSelected} />
      {/* `data-listbox-item-content` is a stable hook for hosts that need to target the option's
          content wrapper (e.g. Select's `matchWidth` truncation) without a brittle structural
          selector. */}
      <span data-listbox-item-content className="flex min-w-0 flex-1 items-center gap-2">
        {children}
      </span>
      <TrailingIndicator indicator={indicator} isSelected={isSelected} isMultiple={ctx.isMultiple} />
    </div>
  );
});

/** Represents the prop surface of `Listbox.Group`. */
export interface ListboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Renders an optional group heading above the contained items. */
  label?: ReactNode;
  children: ReactNode;
}

/** Provides a labelled group wrapping a subset of items. */
export function ListboxGroup({ label, children, className, ...rest }: ListboxGroupProps) {
  const labelId = useId();
  return (
    <div role="group" aria-labelledby={label ? labelId : undefined} className={className} {...rest}>
      {label && (
        <div id={labelId} className={listboxGroupLabelVariants()}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

/** Provides a thin horizontal rule between groups of items. */
export function ListboxSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={listboxSeparatorVariants()} {...props} />;
}

/** Provides the message shown when no items match (e.g., after search filter). */
export function ListboxEmpty({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="presentation" className={cn(listboxEmptyVariants(), className)} {...rest}>
      {children}
    </div>
  );
}

type ListboxComponent = (<T = string>(
  props: ListboxProps<T> & { ref?: Ref<HTMLDivElement> },
) => ReactElement) & {
  Item: typeof ListboxItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

const Listbox = ListboxForwardRef as ListboxComponent;
Listbox.Item = ListboxItem;
Listbox.Group = ListboxGroup;
Listbox.Separator = ListboxSeparator;
Listbox.Empty = ListboxEmpty;

export { Listbox };
export default Listbox;
