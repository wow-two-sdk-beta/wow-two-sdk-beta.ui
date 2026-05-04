import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { RovingFocusGroup, useRovingFocusItem } from '../../primitives';

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
  disabled: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion.* must be used inside <Accordion>');
  return ctx;
}

interface AccordionItemContextValue {
  value: string;
  open: boolean;
  contentId: string;
  triggerId: string;
  disabled: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error('Accordion.Trigger / Content must be used inside <Accordion.Item>');
  return ctx;
}

type SingleProps = {
  type?: 'single';
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  collapsible?: boolean;
};

type MultipleProps = {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  collapsible?: never;
};

export type AccordionProps = HTMLAttributes<HTMLDivElement> &
  (SingleProps | MultipleProps) & {
    disabled?: boolean;
  };

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  props,
  ref,
) {
  const {
    type = 'single',
    value,
    defaultValue,
    onValueChange,
    collapsible = false,
    disabled = false,
    className,
    children,
    ...rest
  } = props as AccordionProps & {
    type?: 'single' | 'multiple';
    value?: string | string[];
    defaultValue?: string | string[];
    onValueChange?: ((v: string) => void) | ((v: string[]) => void);
    collapsible?: boolean;
  };

  const initial = defaultValue ?? (type === 'multiple' ? [] : '');
  const [current, setCurrent] = useControlled<string | string[]>({
    controlled: value,
    default: initial,
    onChange: onValueChange as (v: string | string[]) => void,
  });

  const isOpen = useCallback(
    (val: string) => (Array.isArray(current) ? current.includes(val) : current === val),
    [current],
  );

  const toggle = useCallback(
    (val: string) => {
      if (type === 'multiple') {
        const arr = Array.isArray(current) ? current : [];
        setCurrent(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
      } else {
        if (current === val) {
          if (collapsible) setCurrent('');
        } else {
          setCurrent(val);
        }
      }
    },
    [collapsible, current, setCurrent, type],
  );

  const ctx = useMemo<AccordionContextValue>(
    () => ({ isOpen, toggle, disabled }),
    [isOpen, toggle, disabled],
  );

  return (
    <AccordionContext.Provider value={ctx}>
      <RovingFocusGroup
        ref={ref as never}
        orientation="vertical"
        loop
        className={cn('flex flex-col', className)}
        {...rest}
      >
        {children}
      </RovingFocusGroup>
    </AccordionContext.Provider>
  );
});

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  function AccordionItem({ value, disabled = false, className, children, ...rest }, ref) {
    const accordion = useAccordionContext();
    const open = accordion.isOpen(value);
    const contentId = useId();
    const triggerId = useId();
    const itemDisabled = disabled || accordion.disabled;

    const itemCtx = useMemo<AccordionItemContextValue>(
      () => ({ value, open, contentId, triggerId, disabled: itemDisabled }),
      [value, open, contentId, triggerId, itemDisabled],
    );

    return (
      <AccordionItemContext.Provider value={itemCtx}>
        <div
          ref={ref}
          data-state={open ? 'open' : 'closed'}
          data-disabled={dataAttr(itemDisabled)}
          className={cn('border-b border-border', className)}
          {...rest}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  },
);

export interface AccordionTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  function AccordionTrigger({ className, onClick, children, ...rest }, ref) {
    const accordion = useAccordionContext();
    const item = useAccordionItemContext();
    const roving = useRovingFocusItem();
    return (
      <h3 className="flex">
        <button
          ref={(node) => {
            roving.ref(node);
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          id={item.triggerId}
          type="button"
          aria-expanded={item.open}
          aria-controls={item.contentId}
          data-state={item.open ? 'open' : 'closed'}
          data-disabled={dataAttr(item.disabled)}
          disabled={item.disabled}
          tabIndex={roving.tabIndex}
          onFocus={roving.onFocus}
          onKeyDown={roving.onKeyDown}
          onClick={(e) => {
            onClick?.(e);
            if (e.defaultPrevented || item.disabled) return;
            accordion.toggle(item.value);
          }}
          className={cn(
            'flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className,
          )}
          {...rest}
        >
          <span className="flex-1">{children}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              item.open && 'rotate-180',
            )}
          />
        </button>
      </h3>
    );
  },
);

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  function AccordionContent({ className, children, ...rest }, ref) {
    const item = useAccordionItemContext();
    if (!item.open) return null;
    return (
      <div
        ref={ref}
        id={item.contentId}
        role="region"
        aria-labelledby={item.triggerId}
        data-state="open"
        className={cn('overflow-hidden px-3 pb-3 text-sm text-foreground', className)}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

type AccordionComponent = typeof Accordion & {
  Item: typeof AccordionItem;
  Trigger: typeof AccordionTrigger;
  Content: typeof AccordionContent;
};

(Accordion as AccordionComponent).Item = AccordionItem;
(Accordion as AccordionComponent).Trigger = AccordionTrigger;
(Accordion as AccordionComponent).Content = AccordionContent;

export default Accordion as AccordionComponent;
