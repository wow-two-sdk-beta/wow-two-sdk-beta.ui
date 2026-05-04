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
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Icon } from '../../icons';
import { Dialog, DialogContent } from '../../overlays/dialog';
import {
  listboxEmptyVariants,
  listboxGroupLabelVariants,
  listboxItemVariants,
  listboxSeparatorVariants,
} from '../../forms/listbox/Listbox.variants';

interface CommandItemEntry {
  id: string;
  value: string;
  searchText: string;
  disabled: boolean;
  onSelect: () => void;
  closeOnSelect: boolean;
}

interface CommandPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  inputValue: string;
  setInputValue: (input: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  itemsRef: React.MutableRefObject<CommandItemEntry[]>;
  registerItem: (entry: CommandItemEntry) => void;
  unregisterItem: (id: string) => void;
  filter: (searchText: string, search: string) => boolean;
  inputId: string;
  listboxId: string;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

function useCommandPaletteContext() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('CommandPalette.* must be used inside <CommandPalette>');
  return ctx;
}

const defaultFilter = (searchText: string, search: string) =>
  searchText.toLowerCase().includes(search.toLowerCase());

export interface CommandPaletteProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (input: string) => void;
  triggerKey?: string;
  filter?: (searchText: string, search: string) => boolean;
  children: ReactNode;
}

export function CommandPalette({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  inputValue: inputProp,
  defaultInputValue,
  onInputChange,
  triggerKey,
  filter = defaultFilter,
  children,
}: CommandPaletteProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [inputValue, setInputValue] = useControlled({
    controlled: inputProp,
    default: defaultInputValue ?? '',
    onChange: onInputChange,
  });

  const itemsRef = useRef<CommandItemEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const inputId = useId();
  const listboxId = useId();

  const registerItem = useCallback((entry: CommandItemEntry) => {
    const idx = itemsRef.current.findIndex((i) => i.id === entry.id);
    if (idx >= 0) itemsRef.current[idx] = entry;
    else itemsRef.current.push(entry);
  }, []);

  const unregisterItem = useCallback((id: string) => {
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
  }, []);

  // Global keybinding (cmd-/ctrl-K).
  useEffect(() => {
    if (!triggerKey) return;
    const onKey = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === triggerKey.toLowerCase()) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKey as (e: globalThis.KeyboardEvent) => void);
    return () =>
      document.removeEventListener(
        'keydown',
        onKey as (e: globalThis.KeyboardEvent) => void,
      );
  }, [triggerKey, setOpen]);

  // Reset search + active id on open/close transitions.
  useEffect(() => {
    if (!open) {
      setActiveId(null);
    }
  }, [open]);

  const ctx = useMemo<CommandPaletteContextValue>(
    () => ({
      open,
      setOpen,
      inputValue,
      setInputValue,
      activeId,
      setActiveId,
      itemsRef,
      registerItem,
      unregisterItem,
      filter,
      inputId,
      listboxId,
      inputRef,
    }),
    [
      open,
      setOpen,
      inputValue,
      setInputValue,
      activeId,
      registerItem,
      unregisterItem,
      filter,
      inputId,
      listboxId,
    ],
  );

  return (
    <CommandPaletteContext.Provider value={ctx}>
      <Dialog open={open} onOpenChange={setOpen}>
        {children}
      </Dialog>
    </CommandPaletteContext.Provider>
  );
}

export type CommandPaletteContentProps = HTMLAttributes<HTMLDivElement>;

export const CommandPaletteContent = forwardRef<HTMLDivElement, CommandPaletteContentProps>(
  function CommandPaletteContent({ className, children, ...rest }, forwardedRef) {
    return (
      <DialogContent
        ref={forwardedRef}
        className={cn('w-full max-w-xl gap-0 overflow-hidden p-0', className)}
        {...rest}
      >
        {children}
      </DialogContent>
    );
  },
);

export type CommandPaletteInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
>;

export const CommandPaletteInput = forwardRef<HTMLInputElement, CommandPaletteInputProps>(
  function CommandPaletteInput(
    { className, placeholder = 'Type a command…', onKeyDown, ...rest },
    forwardedRef,
  ) {
    const ctx = useCommandPaletteContext();

    // Keep DOM focus on the input whenever palette is open.
    useEffect(() => {
      if (ctx.open && ctx.inputRef.current) ctx.inputRef.current.focus();
    }, [ctx.open, ctx.inputRef]);

    const visibleItems = useCallback(() => {
      return ctx.itemsRef.current.filter(
        (i) => !i.disabled && (ctx.inputValue === '' || ctx.filter(i.searchText, ctx.inputValue)),
      );
    }, [ctx]);

    // Auto-set first match when filter changes.
    useEffect(() => {
      const list = visibleItems();
      if (list.length > 0 && !list.some((i) => i.id === ctx.activeId)) {
        ctx.setActiveId(list[0]!.id);
      } else if (list.length === 0) {
        ctx.setActiveId(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx.inputValue, ctx.itemsRef.current.length]);

    const moveActive = (direction: 1 | -1) => {
      const list = visibleItems();
      if (list.length === 0) return;
      const idx = list.findIndex((i) => i.id === ctx.activeId);
      let nextIdx = idx + direction;
      if (idx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
      if (nextIdx < 0) nextIdx = list.length - 1;
      if (nextIdx >= list.length) nextIdx = 0;
      ctx.setActiveId(list[nextIdx]!.id);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveActive(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveActive(-1);
          break;
        case 'Home':
          if (e.target === ctx.inputRef.current) {
            const list = visibleItems();
            if (list.length > 0) ctx.setActiveId(list[0]!.id);
          }
          break;
        case 'End':
          if (e.target === ctx.inputRef.current) {
            const list = visibleItems();
            if (list.length > 0) ctx.setActiveId(list[list.length - 1]!.id);
          }
          break;
        case 'Enter': {
          if (!ctx.activeId) return;
          const entry = ctx.itemsRef.current.find((i) => i.id === ctx.activeId);
          if (!entry || entry.disabled) return;
          e.preventDefault();
          entry.onSelect();
          if (entry.closeOnSelect) ctx.setOpen(false);
          break;
        }
      }
    };

    return (
      <div className="flex items-center gap-2 border-b border-border px-3">
        <Icon icon={Search} size={16} className="text-muted-foreground" />
        <input
          {...rest}
          ref={(el) => {
            ctx.inputRef.current = el;
            if (typeof forwardedRef === 'function') forwardedRef(el);
            else if (forwardedRef)
              (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
          }}
          id={ctx.inputId}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={ctx.listboxId}
          aria-activedescendant={ctx.activeId ?? undefined}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={ctx.inputValue}
          onChange={(e) => ctx.setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex h-12 w-full bg-transparent text-sm text-foreground placeholder:text-subtle-foreground outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        />
      </div>
    );
  },
);

export type CommandPaletteListProps = HTMLAttributes<HTMLDivElement>;

export const CommandPaletteList = forwardRef<HTMLDivElement, CommandPaletteListProps>(
  function CommandPaletteList({ className, children, ...rest }, forwardedRef) {
    const ctx = useCommandPaletteContext();
    return (
      <div
        ref={forwardedRef}
        id={ctx.listboxId}
        role="listbox"
        aria-labelledby={ctx.inputId}
        className={cn('max-h-80 overflow-y-auto p-1', className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

export interface CommandPaletteGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
}

export function CommandPaletteGroup({
  label,
  children,
  className,
  ...rest
}: CommandPaletteGroupProps) {
  const labelId = useId();
  return (
    <div
      role="group"
      aria-labelledby={label ? labelId : undefined}
      className={className}
      {...rest}
    >
      {label && (
        <div id={labelId} className={listboxGroupLabelVariants()}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

export function CommandPaletteSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={listboxSeparatorVariants()} {...props} />;
}

export interface CommandPaletteItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  /** Text used by the filter; defaults to `value`. Pass when children include icons. */
  searchText?: string;
  disabled?: boolean;
  onSelect?: () => void;
  closeOnSelect?: boolean;
  children: ReactNode;
}

export const CommandPaletteItem = forwardRef<HTMLDivElement, CommandPaletteItemProps>(
  function CommandPaletteItem(
    {
      value,
      searchText,
      disabled = false,
      onSelect,
      closeOnSelect = true,
      className,
      children,
      onClick,
      onPointerEnter,
      ...rest
    },
    forwardedRef,
  ) {
    const ctx = useCommandPaletteContext();
    const id = useId();

    // Resolve text for filter — fall back to children if string.
    const resolvedSearch =
      searchText ??
      (typeof children === 'string' ? children : Array.isArray(children) ? children.filter((c) => typeof c === 'string').join(' ') : value);

    useEffect(() => {
      ctx.registerItem({
        id,
        value,
        searchText: resolvedSearch,
        disabled,
        onSelect: () => onSelect?.(),
        closeOnSelect,
      });
      return () => ctx.unregisterItem(id);
    }, [ctx, id, value, resolvedSearch, disabled, onSelect, closeOnSelect]);

    // Hide if filtered out.
    const matches = ctx.inputValue === '' || ctx.filter(resolvedSearch, ctx.inputValue);
    if (!matches) return null;

    const isActive = ctx.activeId === id;
    const state = disabled ? 'disabled' : isActive ? 'active' : 'default';

    return (
      <div
        ref={forwardedRef}
        id={id}
        role="option"
        aria-selected={isActive}
        aria-disabled={disabled || undefined}
        data-active={isActive ? '' : undefined}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented || disabled) return;
          onSelect?.();
          if (closeOnSelect) ctx.setOpen(false);
        }}
        onPointerEnter={(e) => {
          onPointerEnter?.(e);
          if (!disabled) ctx.setActiveId(id);
        }}
        className={cn(listboxItemVariants({ state }), className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

export type CommandPaletteEmptyProps = HTMLAttributes<HTMLDivElement>;

export const CommandPaletteEmpty = forwardRef<HTMLDivElement, CommandPaletteEmptyProps>(
  function CommandPaletteEmpty({ className, children, ...rest }, forwardedRef) {
    const ctx = useCommandPaletteContext();
    // Show only when zero items match.
    const matchCount = ctx.itemsRef.current.filter(
      (i) => ctx.inputValue === '' || ctx.filter(i.searchText, ctx.inputValue),
    ).length;
    if (matchCount > 0) return null;
    return (
      <div
        ref={forwardedRef}
        role="presentation"
        className={cn(listboxEmptyVariants(), className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

type CommandPaletteComponent = typeof CommandPalette & {
  Content: typeof CommandPaletteContent;
  Input: typeof CommandPaletteInput;
  List: typeof CommandPaletteList;
  Group: typeof CommandPaletteGroup;
  Item: typeof CommandPaletteItem;
  Empty: typeof CommandPaletteEmpty;
  Separator: typeof CommandPaletteSeparator;
};

(CommandPalette as CommandPaletteComponent).Content = CommandPaletteContent;
(CommandPalette as CommandPaletteComponent).Input = CommandPaletteInput;
(CommandPalette as CommandPaletteComponent).List = CommandPaletteList;
(CommandPalette as CommandPaletteComponent).Group = CommandPaletteGroup;
(CommandPalette as CommandPaletteComponent).Item = CommandPaletteItem;
(CommandPalette as CommandPaletteComponent).Empty = CommandPaletteEmpty;
(CommandPalette as CommandPaletteComponent).Separator = CommandPaletteSeparator;

export default CommandPalette as CommandPaletteComponent;
