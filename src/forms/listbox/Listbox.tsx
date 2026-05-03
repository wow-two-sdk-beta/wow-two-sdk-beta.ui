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
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
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

interface ItemEntry {
  id: string;
  value: string;
  disabled: boolean;
  ref: HTMLDivElement | null;
}

interface ListboxContextValue {
  multiple: boolean;
  values: string[];
  activeId: string | null;
  onItemSelect: (value: string) => void;
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

type SingleProps = {
  multiple?: false;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};
type MultiProps = {
  multiple: true;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
};

export type ListboxProps = HTMLAttributes<HTMLDivElement> &
  (SingleProps | MultiProps) & {
    /** Disable all items. */
    disabled?: boolean;
    /** Optional class to override container styles. */
    className?: string;
    children: ReactNode;
  };

export const Listbox = forwardRef<HTMLDivElement, ListboxProps>(function Listbox(
  props,
  ref,
) {
  const {
    multiple = false,
    value,
    defaultValue,
    onValueChange,
    disabled,
    className,
    children,
    onKeyDown,
    ...rest
  } = props as ListboxProps & {
    multiple?: boolean;
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: ((v: string) => void) | ((v: string[]) => void);
  };

  const initial: string | string[] =
    defaultValue ?? (multiple ? [] : '');
  const [current, setCurrent] = useControlled<string | string[]>({
    controlled: value,
    default: initial,
    onChange: onValueChange as (v: string | string[]) => void,
  });
  const values = useMemo(
    () => (Array.isArray(current) ? current : current ? [current] : []),
    [current],
  );

  const items = useRef<ItemEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const registerItem = useCallback((entry: ItemEntry) => {
    if (!items.current.some((i) => i.id === entry.id)) items.current.push(entry);
  }, []);
  const updateItem = useCallback((entry: ItemEntry) => {
    const idx = items.current.findIndex((i) => i.id === entry.id);
    if (idx >= 0) items.current[idx] = entry;
  }, []);
  const unregisterItem = useCallback((id: string) => {
    items.current = items.current.filter((i) => i.id !== id);
  }, []);

  const onItemSelect = useCallback(
    (next: string) => {
      if (multiple) {
        const cur = Array.isArray(current) ? current : [];
        const has = cur.includes(next);
        setCurrent(has ? cur.filter((v) => v !== next) : [...cur, next]);
      } else {
        setCurrent(next);
      }
    },
    [multiple, current, setCurrent],
  );

  // Initialise active descendant — first selected, else first enabled.
  useEffect(() => {
    if (activeId) return;
    const firstSelected = items.current.find(
      (i) => !i.disabled && values.includes(i.value),
    );
    const firstEnabled = items.current.find((i) => !i.disabled);
    setActiveId((firstSelected ?? firstEnabled)?.id ?? null);
    // run once after mount when items have registered
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
      activeId,
      onItemSelect,
      registerItem: (e) => {
        const existing = items.current.find((i) => i.id === e.id);
        if (existing) updateItem(e);
        else registerItem(e);
      },
      unregisterItem,
      setActiveId,
    }),
    [multiple, values, activeId, onItemSelect, registerItem, unregisterItem, updateItem],
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
});

export interface ListboxItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
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
    ctx.registerItem({ id, value, disabled, ref: ref.current });
    return () => ctx.unregisterItem(id);
  }, [ctx, id, value, disabled]);

  const isSelected = ctx.values.includes(value);
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

type ListboxComponent = typeof Listbox & {
  Item: typeof ListboxItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

(Listbox as ListboxComponent).Item = ListboxItem;
(Listbox as ListboxComponent).Group = ListboxGroup;
(Listbox as ListboxComponent).Separator = ListboxSeparator;
(Listbox as ListboxComponent).Empty = ListboxEmpty;

export default Listbox as ListboxComponent;
