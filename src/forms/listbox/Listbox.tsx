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
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import {
  listboxEmptyVariants,
  listboxGroupLabelVariants,
  listboxItemVariants,
  listboxSeparatorVariants,
  listboxVariants,
} from './Listbox.variants';

/** Equality comparer — used to match items against the current selection. */
export type EqualityFn<T> = (a: T, b: T) => boolean;

/* Default equality: Object.is. Correct for primitives + NaN; reference-equality for objects. */
const defaultEquals: EqualityFn<unknown> = (a, b) => Object.is(a, b);

interface ItemEntry {
  id: string;
  value: unknown;
  disabled: boolean;
}

interface ListboxContextValue {
  multiple: boolean;
  values: unknown[];
  isEqual: EqualityFn<unknown>;
  activeId: string | null;
  onItemSelect: (value: unknown) => void;
  registerItem: (entry: ItemEntry) => void;
  unregisterItem: (id: string) => void;
  setActiveId: (id: string | null) => void;
}

const ListboxContext = createContext<ListboxContextValue | null>(null);

function useListboxContext() {
  const ctx = useContext(ListboxContext);
  if (!ctx) throw new Error('Listbox.Item / Group / Separator must be used inside <Listbox>');
  return ctx;
}

type SingleProps<T> = {
  multiple?: false;
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T | undefined) => void;
};

type MultiProps<T> = {
  multiple: true;
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (value: T[]) => void;
};

type CommonProps<T> = {
  /** Disable all items. */
  disabled?: boolean;
  /** Custom equality. Defaults to `Object.is`. */
  isEqual?: EqualityFn<T>;
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
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    isEqual,
    disabled,
    className,
    children,
    onKeyDown,
    ...rest
  } = props as ListboxProps<T> & {
    multiple?: boolean;
    value?: T | T[];
    defaultValue?: T | T[];
    onValueChange?: ((v: T | undefined) => void) | ((v: T[]) => void);
  };

  const equals = (isEqual as EqualityFn<unknown> | undefined) ?? defaultEquals;

  const initial: T | T[] | undefined = defaultValue ?? (multiple ? ([] as T[]) : undefined);
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
      if (multiple) {
        const cur = (Array.isArray(current) ? current : []) as unknown[];
        const has = cur.some((v) => equals(v, next));
        const out = has ? cur.filter((v) => !equals(v, next)) : [...cur, next];
        (setCurrent as (v: unknown[]) => void)(out);
      } else {
        (setCurrent as (v: unknown) => void)(next);
      }
    },
    [multiple, current, setCurrent, equals],
  );

  // Initialise active descendant — first selected, else first enabled.
  useEffect(() => {
    if (activeId) return;
    const firstSelected = items.current.find(
      (i) => !i.disabled && values.some((v) => equals(v, i.value)),
    );
    const firstEnabled = items.current.find((i) => !i.disabled);
    setActiveId((firstSelected ?? firstEnabled)?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveActive = useCallback(
    (direction: 1 | -1, jump = 1) => {
      const list = items.current.filter((i) => !i.disabled);
      if (list.length === 0) return;
      const currentIdx = list.findIndex((i) => i.id === activeId);
      let nextIdx = currentIdx + direction * jump;
      if (currentIdx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
      if (nextIdx < 0) nextIdx = 0;
      if (nextIdx >= list.length) nextIdx = list.length - 1;
      const nextEntry = list[nextIdx];
      if (nextEntry) setActiveId(nextEntry.id);
    },
    [activeId],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || disabled) return;
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
          if (!entry || entry.disabled) return;
          event.preventDefault();
          onItemSelect(entry.value);
          break;
        }
      }
    },
    [activeId, disabled, moveActive, onItemSelect, onKeyDown],
  );

  const ctx = useMemo<ListboxContextValue>(
    () => ({
      multiple,
      values,
      isEqual: equals,
      activeId,
      onItemSelect,
      registerItem,
      unregisterItem,
      setActiveId,
    }),
    [multiple, values, equals, activeId, onItemSelect, registerItem, unregisterItem],
  );

  return (
    <ListboxContext.Provider value={ctx}>
      <div
        ref={ref}
        role="listbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiselectable={multiple || undefined}
        aria-activedescendant={activeId ?? undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        className={cn(listboxVariants(), className)}
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

export interface ListboxItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Item value. Typed as `unknown` at call site; compared via parent Listbox's `isEqual`. */
  value: unknown;
  disabled?: boolean;
  children: ReactNode;
}

export const ListboxItem = forwardRef<HTMLDivElement, ListboxItemProps>(function ListboxItem(
  { value, disabled = false, className, children, onClick, onPointerEnter, ...rest },
  forwardedRef,
) {
  const ctx = useListboxContext();
  const id = useId();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ctx.registerItem({ id, value, disabled });
    return () => ctx.unregisterItem(id);
  }, [ctx, id, value, disabled]);

  const isSelected = ctx.values.some((v) => ctx.isEqual(v, value));
  const isActive = ctx.activeId === id;
  const state = disabled
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
      aria-disabled={disabled || undefined}
      data-active={isActive ? '' : undefined}
      data-selected={isSelected ? '' : undefined}
      data-disabled={disabled ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || disabled) return;
        ctx.onItemSelect(value);
      }}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        if (!disabled) ctx.setActiveId(id);
      }}
      className={cn(listboxItemVariants({ state }), className)}
      {...rest}
    >
      <span className="flex-1">{children}</span>
      {ctx.multiple && isSelected && <Check className="h-4 w-4" />}
      {!ctx.multiple && isSelected && <Check className="h-4 w-4 opacity-80" />}
    </div>
  );
});

export interface ListboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional group heading. */
  label?: ReactNode;
  children: ReactNode;
}

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

export function ListboxSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={listboxSeparatorVariants()} {...props} />;
}

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
