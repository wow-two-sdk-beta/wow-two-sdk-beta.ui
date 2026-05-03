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
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { AnchoredPositioner, DismissableLayer, Portal } from '../../primitives';
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
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
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
  /** Default open state (uncontrolled). */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
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
      // Return focus to trigger
      requestAnimationFrame(() => triggerRef.current?.focus());
    },
    [setValueState, setOpenState],
  );

  const ctx = useMemo<SelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      value: valueState,
      onSelect,
      triggerRef,
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

  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

export interface SelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ size, state, className, onClick, children, ...rest }, forwardedRef) {
    const ctx = useSelectContext();
    const triggerState = state ?? (ctx.invalid ? 'invalid' : 'default');
    return (
      <button
        ref={composeRefs(forwardedRef, ctx.triggerRef)}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={ctx.open}
        data-state={ctx.open ? 'open' : 'closed'}
        disabled={ctx.disabled}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.setOpen(!ctx.open);
        }}
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
  /** Placement of the panel relative to trigger. Default `bottom`. */
  placement?: React.ComponentProps<typeof AnchoredPositioner>['placement'];
  /** Distance from trigger. Default 6. */
  offset?: number;
  children: ReactNode;
}

export function SelectContent({
  className,
  placement = 'bottom',
  offset = 6,
  children,
}: SelectContentProps) {
  const ctx = useSelectContext();
  if (!ctx.open) return null;
  return (
    <Portal>
      <AnchoredPositioner anchor={ctx.triggerRef.current} placement={placement} offset={offset}>
        <FocusScope asChild trapped loop>
          <DismissableLayer
            onEscape={() => ctx.setOpen(false)}
            onOutsidePointerDown={(e) => {
              if (ctx.triggerRef.current?.contains(e.target as Node)) return;
              ctx.setOpen(false);
            }}
          >
            <Listbox
              value={ctx.value}
              onValueChange={(v) => ctx.onSelect(v as string)}
              className={cn('min-w-[var(--radix-anchor-width)]', className)}
              style={
                ctx.triggerRef.current
                  ? { minWidth: ctx.triggerRef.current.offsetWidth }
                  : undefined
              }
            >
              {children}
            </Listbox>
          </DismissableLayer>
        </FocusScope>
      </AnchoredPositioner>
      {ctx.name && <input type="hidden" name={ctx.name} value={ctx.value} />}
    </Portal>
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
