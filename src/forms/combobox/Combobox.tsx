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
import { Check } from 'lucide-react';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { AnchoredPositioner, DismissableLayer, Portal } from '../../primitives';
import { inputBaseVariants, type InputBaseVariants } from '../InputStyles';
import {
  listboxVariants,
  listboxItemVariants,
  listboxGroupLabelVariants,
  listboxSeparatorVariants,
  listboxEmptyVariants,
} from '../listbox/Listbox.variants';

interface ComboboxItemEntry {
  id: string;
  value: string;
  disabled: boolean;
  label: ReactNode;
}

interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  setValue: (value: string) => void;
  inputValue: string;
  setInputValue: (input: string) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  registerItem: (entry: ComboboxItemEntry) => void;
  unregisterItem: (id: string) => void;
  itemsRef: React.MutableRefObject<ComboboxItemEntry[]>;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  listboxId: string;
  disabled: boolean;
  invalid?: boolean;
  selectItem: (entry: ComboboxItemEntry, options?: { close?: boolean }) => void;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

function useComboboxContext() {
  const ctx = useContext(ComboboxContext);
  if (!ctx) throw new Error('Combobox.* must be used inside <Combobox>');
  return ctx;
}

export interface ComboboxProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  inputValue?: string;
  defaultInputValue?: string;
  onInputChange?: (input: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When the user picks an item, set the input value to its label. Default true. */
  fillInputOnSelect?: boolean;
  children: ReactNode;
}

export function Combobox({
  value,
  defaultValue,
  onValueChange,
  inputValue,
  defaultInputValue,
  onInputChange,
  disabled = false,
  invalid,
  name,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  fillInputOnSelect = true,
  children,
}: ComboboxProps) {
  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [valueState, setValueState] = useControlled({
    controlled: value,
    default: defaultValue ?? '',
    onChange: onValueChange,
  });
  const [inputState, setInputState] = useControlled({
    controlled: inputValue,
    default: defaultInputValue ?? '',
    onChange: onInputChange,
  });

  const itemsRef = useRef<ComboboxItemEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const listboxId = useId();

  const registerItem = useCallback((entry: ComboboxItemEntry) => {
    const idx = itemsRef.current.findIndex((i) => i.id === entry.id);
    if (idx >= 0) itemsRef.current[idx] = entry;
    else itemsRef.current.push(entry);
  }, []);
  const unregisterItem = useCallback((id: string) => {
    itemsRef.current = itemsRef.current.filter((i) => i.id !== id);
  }, []);

  const selectItem = useCallback(
    (entry: ComboboxItemEntry, opts?: { close?: boolean }) => {
      setValueState(entry.value);
      if (fillInputOnSelect) {
        const text = typeof entry.label === 'string' ? entry.label : entry.value;
        setInputState(text);
      }
      if (opts?.close ?? true) setOpenState(false);
    },
    [setValueState, setInputState, setOpenState, fillInputOnSelect],
  );

  const ctx = useMemo<ComboboxContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      value: valueState,
      setValue: setValueState,
      inputValue: inputState,
      setInputValue: setInputState,
      activeId,
      setActiveId,
      registerItem,
      unregisterItem,
      itemsRef,
      inputRef,
      listboxId,
      disabled,
      invalid,
      selectItem,
    }),
    [
      openState,
      setOpenState,
      valueState,
      setValueState,
      inputState,
      setInputState,
      activeId,
      registerItem,
      unregisterItem,
      listboxId,
      disabled,
      invalid,
      selectItem,
    ],
  );

  return (
    <ComboboxContext.Provider value={ctx}>
      {children}
      {name && <input type="hidden" name={name} value={valueState} />}
    </ComboboxContext.Provider>
  );
}

export interface ComboboxInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>,
    InputBaseVariants {}

export const ComboboxInput = forwardRef<HTMLInputElement, ComboboxInputProps>(
  function ComboboxInput(
    { className, size, state, onKeyDown, onFocus, ...rest },
    forwardedRef,
  ) {
    const ctx = useComboboxContext();
    const inputState = state ?? (ctx.invalid ? 'invalid' : 'default');

    const moveActive = useCallback(
      (direction: 1 | -1) => {
        const list = ctx.itemsRef.current.filter((i) => !i.disabled);
        if (list.length === 0) return;
        const idx = list.findIndex((i) => i.id === ctx.activeId);
        let nextIdx = idx + direction;
        if (idx === -1) nextIdx = direction === 1 ? 0 : list.length - 1;
        if (nextIdx < 0) nextIdx = list.length - 1;
        if (nextIdx >= list.length) nextIdx = 0;
        const next = list[nextIdx];
        if (next) ctx.setActiveId(next.id);
      },
      [ctx],
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented || ctx.disabled) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!ctx.open) ctx.setOpen(true);
          else moveActive(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!ctx.open) ctx.setOpen(true);
          else moveActive(-1);
          break;
        case 'Home':
          if (ctx.open) {
            e.preventDefault();
            const first = ctx.itemsRef.current.find((i) => !i.disabled);
            if (first) ctx.setActiveId(first.id);
          }
          break;
        case 'End':
          if (ctx.open) {
            e.preventDefault();
            const list = ctx.itemsRef.current.filter((i) => !i.disabled);
            const last = list[list.length - 1];
            if (last) ctx.setActiveId(last.id);
          }
          break;
        case 'Enter': {
          if (!ctx.open || !ctx.activeId) return;
          const entry = ctx.itemsRef.current.find((i) => i.id === ctx.activeId);
          if (!entry || entry.disabled) return;
          e.preventDefault();
          ctx.selectItem(entry);
          break;
        }
        case 'Escape':
          if (ctx.open) {
            e.preventDefault();
            ctx.setOpen(false);
          } else if (ctx.inputValue) {
            e.preventDefault();
            ctx.setInputValue('');
            ctx.setValue('');
          }
          break;
      }
    };

    return (
      <input
        ref={composeRefs(forwardedRef, ctx.inputRef)}
        type="text"
        role="combobox"
        aria-expanded={ctx.open}
        aria-controls={ctx.listboxId}
        aria-activedescendant={ctx.activeId ?? undefined}
        aria-autocomplete="list"
        aria-disabled={ctx.disabled || undefined}
        disabled={ctx.disabled}
        value={ctx.inputValue}
        onChange={(e) => {
          ctx.setInputValue(e.target.value);
          if (!ctx.open) ctx.setOpen(true);
          // Clear active when input changes — re-init on next render of items.
          ctx.setActiveId(null);
        }}
        onFocus={(e) => {
          onFocus?.(e);
          if (!ctx.open) ctx.setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className={cn(inputBaseVariants({ size, state: inputState }), className)}
        {...rest}
      />
    );
  },
);

export interface ComboboxContentProps {
  className?: string;
  placement?: React.ComponentProps<typeof AnchoredPositioner>['placement'];
  offset?: number;
  children: ReactNode;
}

export function ComboboxContent({
  className,
  placement = 'bottom',
  offset = 6,
  children,
}: ComboboxContentProps) {
  const ctx = useComboboxContext();
  if (!ctx.open) return null;
  return (
    <Portal>
      <AnchoredPositioner anchor={ctx.inputRef.current} placement={placement} offset={offset}>
        <DismissableLayer
          onEscape={() => ctx.setOpen(false)}
          onOutsidePointerDown={(e) => {
            if (ctx.inputRef.current?.contains(e.target as Node)) return;
            ctx.setOpen(false);
          }}
        >
          <div
            id={ctx.listboxId}
            role="listbox"
            className={cn(listboxVariants(), className)}
            style={
              ctx.inputRef.current
                ? { minWidth: ctx.inputRef.current.offsetWidth }
                : undefined
            }
          >
            {children}
          </div>
        </DismissableLayer>
      </AnchoredPositioner>
    </Portal>
  );
}

export interface ComboboxItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export const ComboboxItem = forwardRef<HTMLDivElement, ComboboxItemProps>(function ComboboxItem(
  { value, disabled = false, className, children, onClick, onPointerEnter, ...rest },
  forwardedRef,
) {
  const ctx = useComboboxContext();
  const id = useId();

  useEffect(() => {
    ctx.registerItem({ id, value, disabled, label: children });
    return () => ctx.unregisterItem(id);
  }, [ctx, id, value, disabled, children]);

  // Auto-set first matching item active on render if no active id.
  useEffect(() => {
    if (!ctx.activeId) {
      const list = ctx.itemsRef.current.filter((i) => !i.disabled);
      if (list[0]) ctx.setActiveId(list[0].id);
    }
  }, [ctx]);

  const isSelected = ctx.value === value;
  const isActive = ctx.activeId === id;
  const state = disabled
    ? 'disabled'
    : isSelected
      ? 'selected'
      : isActive
        ? 'active'
        : 'default';

  return (
    <div
      ref={forwardedRef}
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled || undefined}
      data-active={isActive ? '' : undefined}
      data-selected={isSelected ? '' : undefined}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || disabled) return;
        ctx.selectItem({ id, value, disabled, label: children });
      }}
      onPointerEnter={(e) => {
        onPointerEnter?.(e);
        if (!disabled) ctx.setActiveId(id);
      }}
      className={cn(listboxItemVariants({ state }), className)}
      {...rest}
    >
      <span className="flex-1">{children}</span>
      {isSelected && <Check className="h-4 w-4 opacity-80" />}
    </div>
  );
});

export interface ComboboxGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  children: ReactNode;
}

export function ComboboxGroup({ label, children, className, ...rest }: ComboboxGroupProps) {
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

export function ComboboxSeparator(props: HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={listboxSeparatorVariants()} {...props} />;
}

export function ComboboxEmpty({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div role="presentation" className={cn(listboxEmptyVariants(), className)} {...rest}>
      {children}
    </div>
  );
}

type ComboboxComponent = typeof Combobox & {
  Input: typeof ComboboxInput;
  Content: typeof ComboboxContent;
  Item: typeof ComboboxItem;
  Group: typeof ComboboxGroup;
  Separator: typeof ComboboxSeparator;
  Empty: typeof ComboboxEmpty;
};

(Combobox as ComboboxComponent).Input = ComboboxInput;
(Combobox as ComboboxComponent).Content = ComboboxContent;
(Combobox as ComboboxComponent).Item = ComboboxItem;
(Combobox as ComboboxComponent).Group = ComboboxGroup;
(Combobox as ComboboxComponent).Separator = ComboboxSeparator;
(Combobox as ComboboxComponent).Empty = ComboboxEmpty;

export default Combobox as ComboboxComponent;
