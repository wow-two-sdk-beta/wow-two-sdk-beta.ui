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
import { ChevronDown, X } from 'lucide-react';
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
import { selectTriggerVariants, type SelectTriggerVariants } from '../select/Select.variants';

interface MultiSelectContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  values: string[];
  setValues: (values: string[]) => void;
  labels: Record<string, ReactNode>;
  registerLabel: (value: string, label: ReactNode) => void;
  unregisterLabel: (value: string) => void;
  disabled: boolean;
  name?: string;
  invalid?: boolean;
}

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null);

function useMultiSelectContext() {
  const ctx = useContext(MultiSelectContext);
  if (!ctx) throw new Error('MultiSelect.* must be used inside <MultiSelect>');
  return ctx;
}

export interface MultiSelectProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: React.ComponentProps<typeof Popover>['placement'];
  children: ReactNode;
}

export function MultiSelect({
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
}: MultiSelectProps) {
  const [openState, setOpenState] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [valuesState, setValuesState] = useControlled<string[]>({
    controlled: value,
    default: defaultValue ?? [],
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

  const ctx = useMemo<MultiSelectContextValue>(
    () => ({
      open: openState,
      setOpen: setOpenState,
      values: valuesState,
      setValues: setValuesState,
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
      valuesState,
      setValuesState,
      labels,
      registerLabel,
      unregisterLabel,
      disabled,
      name,
      invalid,
    ],
  );

  return (
    <MultiSelectContext.Provider value={ctx}>
      <Popover
        open={openState}
        onOpenChange={setOpenState}
        placement={placement}
        offset={6}
      >
        {children}
      </Popover>
    </MultiSelectContext.Provider>
  );
}

export interface MultiSelectTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    SelectTriggerVariants {
  children?: ReactNode;
}

export const MultiSelectTrigger = forwardRef<HTMLButtonElement, MultiSelectTriggerProps>(
  function MultiSelectTrigger(
    { size, state, className, onKeyDown, children, ...rest },
    ref,
  ) {
    const ctx = useMultiSelectContext();
    const triggerState = state ?? (ctx.invalid ? 'invalid' : 'default');
    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          disabled={ctx.disabled}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (e.key === 'Backspace' && ctx.values.length > 0) {
              ctx.setValues(ctx.values.slice(0, -1));
            }
          }}
          className={cn(
            selectTriggerVariants({ size, state: triggerState }),
            'h-auto min-h-10 flex-wrap py-1.5',
            className,
          )}
          {...rest}
        >
          {children ?? <MultiSelectTags />}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 self-center text-muted-foreground transition-transform',
              ctx.open && 'rotate-180',
            )}
          />
        </button>
      </PopoverTrigger>
    );
  },
);

export interface MultiSelectTagsProps {
  /** Shown when no values selected. */
  placeholder?: ReactNode;
}

export function MultiSelectTags({ placeholder }: MultiSelectTagsProps) {
  const ctx = useMultiSelectContext();
  if (ctx.values.length === 0) {
    return <span className="text-subtle-foreground">{placeholder}</span>;
  }
  return (
    <span className="flex flex-1 flex-wrap items-center gap-1">
      {ctx.values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-sm bg-muted px-1.5 py-0.5 text-xs"
        >
          {ctx.labels[v] ?? v}
          {!ctx.disabled && (
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Remove ${typeof ctx.labels[v] === 'string' ? ctx.labels[v] : v}`}
              onClick={(e) => {
                e.stopPropagation();
                ctx.setValues(ctx.values.filter((x) => x !== v));
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="cursor-pointer rounded-sm p-0.5 hover:bg-border"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

export interface MultiSelectContentProps {
  className?: string;
  children: ReactNode;
}

export function MultiSelectContent({ className, children }: MultiSelectContentProps) {
  const ctx = useMultiSelectContext();
  return (
    <PopoverContent bare>
      <Listbox
        multiple
        value={ctx.values}
        onValueChange={(v) => ctx.setValues(v as string[])}
        className={cn('min-w-[var(--anchor-width)]', className)}
      >
        {children}
      </Listbox>
      {ctx.name &&
        ctx.values.map((v) => <input key={v} type="hidden" name={ctx.name} value={v} />)}
    </PopoverContent>
  );
}

export type MultiSelectItemProps = ListboxItemProps;

export const MultiSelectItem = forwardRef<HTMLDivElement, MultiSelectItemProps>(
  function MultiSelectItem(props, ref) {
    const ctx = useMultiSelectContext();
    useEffect(() => {
      ctx.registerLabel(props.value, props.children);
      return () => ctx.unregisterLabel(props.value);
    }, [ctx, props.value, props.children]);
    return <ListboxItem ref={ref} {...props} />;
  },
);

type MultiSelectComponent = typeof MultiSelect & {
  Trigger: typeof MultiSelectTrigger;
  Tags: typeof MultiSelectTags;
  Content: typeof MultiSelectContent;
  Item: typeof MultiSelectItem;
  Group: typeof ListboxGroup;
  Separator: typeof ListboxSeparator;
  Empty: typeof ListboxEmpty;
};

(MultiSelect as MultiSelectComponent).Trigger = MultiSelectTrigger;
(MultiSelect as MultiSelectComponent).Tags = MultiSelectTags;
(MultiSelect as MultiSelectComponent).Content = MultiSelectContent;
(MultiSelect as MultiSelectComponent).Item = MultiSelectItem;
(MultiSelect as MultiSelectComponent).Group = ListboxGroup;
(MultiSelect as MultiSelectComponent).Separator = ListboxSeparator;
(MultiSelect as MultiSelectComponent).Empty = ListboxEmpty;

export default MultiSelect as MultiSelectComponent;
