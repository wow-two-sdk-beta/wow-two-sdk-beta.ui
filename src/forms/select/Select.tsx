import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import { useControlled } from '../../hooks';
import { Popover, PopoverContent, PopoverTrigger } from '../../overlays';
import {
  Listbox,
  ListboxItem,
  ListboxGroup,
  ListboxSeparator,
  ListboxEmpty,
  type ListboxItemProps,
} from '../listbox';
import { selectTriggerVariants, type SelectTriggerVariants } from './Select.variants';

interface SelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value: string;
  onSelect: (value: string) => void;
  labels: Record<string, ReactNode>;
  registerLabel: (value: string, label: ReactNode) => void;
  unregisterLabel: (value: string) => void;
  disabled: boolean;
  name?: string;
  invalid?: boolean;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error('Select.* must be used inside <Select>');
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** Hidden form-input name. If set, value ships with native form submission. */
  name?: string;
  /** Style trigger as invalid (red border, error ring). */
  invalid?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Floating placement of the dropdown. */
  placement?: React.ComponentProps<typeof Popover>['placement'];
  children: ReactNode;
}

export function Select({
  value,
  defaultValue,
  onValueChange,
  disabled = false,
  name,
  invalid,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  placement = 'bottom',
  children,
}: SelectProps) {
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
  const [labels, setLabels] = useState<Record<string, ReactNode>>({});

  const registerLabel = useCallback((v: string, label: ReactNode) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  }, []);
  const unregisterLabel = useCallback((v: string) => {
    setLabels((prev) => {
      if (!(v in prev)) return prev;
      const next = { ...prev };
      delete next[v];
      return next;
    });
  }, []);

  const onSelect = useCallback(
    (next: string) => {
      setValueState(next);
      setOpenState(false);
    },
    [setValueState, setOpenState],
  );

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      value: valueState,
      onSelect,
      labels,
      registerLabel,
      unregisterLabel,
      disabled,
      name,
      invalid,
    }),
    [
      openState,
      setOpenState,
      valueState,
      onSelect,
      labels,
      registerLabel,
      unregisterLabel,
      disabled,
      name,
      invalid,
    ],
  );

  return (
    <SelectContext.Provider value={ctx}>
      <Popover
        open={openState}
        onOpenChange={setOpenState}
        placement={placement}
        offset={6}
      >
        {children}
      </Popover>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ size, state, className, children, ...rest }, ref) {
    const ctx = useSelectContext();
    const triggerState = state ?? (ctx.invalid ? 'invalid' : 'default');
    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={ctx.disabled}
          className={cn(selectTriggerVariants({ size, state: triggerState }), className)}
          {...rest}
        >
          {children ?? <SelectValue />}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              ctx.open && 'rotate-180',
            )}
          />
        </button>
      </PopoverTrigger>
    );
  },
);

export interface SelectValueProps {
  /** Shown when nothing is selected. */
  placeholder?: ReactNode;
  /** Optional explicit override (e.g., custom rendering). */
  children?: ReactNode;
}

export function SelectValue({ placeholder, children }: SelectValueProps) {
  const ctx = useSelectContext();
  if (children) return <span className="truncate">{children}</span>;
  const label = ctx.value ? (ctx.labels[ctx.value] ?? ctx.value) : null;
  return (
    <span className={cn('truncate', !label && 'text-subtle-foreground')}>
      {label ?? placeholder}
    </span>
  );
}

export interface SelectContentProps {
  className?: string;
  children: ReactNode;
}

export function SelectContent({ className, children }: SelectContentProps) {
  const ctx = useSelectContext();
  return (
    <PopoverContent bare>
      <Listbox
        value={ctx.value}
        onValueChange={(v) => ctx.onSelect(v as string)}
        className={cn('min-w-[var(--anchor-width)]', className)}
      >
        {children}
      </Listbox>
      {ctx.name && <input type="hidden" name={ctx.name} value={ctx.value} />}
    </PopoverContent>
  );
}

export type SelectItemProps = ListboxItemProps;

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(function SelectItem(
  props,
  ref,
) {
  const ctx = useSelectContext();
  useEffect(() => {
    ctx.registerLabel(props.value, props.children);
    return () => ctx.unregisterLabel(props.value);
  }, [ctx, props.value, props.children]);
  return <ListboxItem ref={ref} {...props} />;
});

type SelectComponent = typeof Select & {
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

(Select as SelectComponent).Trigger = SelectTrigger;
(Select as SelectComponent).Value = SelectValue;
(Select as SelectComponent).Content = SelectContent;
(Select as SelectComponent).Item = SelectItem;
(Select as SelectComponent).Group = ListboxGroup;
(Select as SelectComponent).Separator = ListboxSeparator;
(Select as SelectComponent).Empty = ListboxEmpty;

export default Select as SelectComponent;
