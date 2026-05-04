import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, dataAttr } from '../../utils';
import { useControlled } from '../../hooks';
import { Slot } from '../../primitives';

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  triggerId: string;
  disabled: boolean;
}

const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext() {
  const ctx = useContext(CollapsibleContext);
  if (!ctx) throw new Error('Collapsible.* must be used inside <Collapsible>');
  return ctx;
}

export interface CollapsibleProps extends HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { open: openProp, defaultOpen = false, onOpenChange, disabled = false, className, children, ...rest },
  ref,
) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const contentId = useId();
  const triggerId = useId();

  const ctx = useMemo<CollapsibleContextValue>(
    () => ({ open, setOpen, contentId, triggerId, disabled }),
    [open, setOpen, contentId, triggerId, disabled],
  );

  return (
    <CollapsibleContext.Provider value={ctx}>
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        data-disabled={dataAttr(disabled)}
        className={className}
        {...rest}
      >
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
});

export interface CollapsibleTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children: ReactNode;
}

export const CollapsibleTrigger = forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  function CollapsibleTrigger({ asChild, onClick, children, ...rest }, ref) {
    const ctx = useCollapsibleContext();
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={ref as never}
        id={ctx.triggerId}
        type="button"
        aria-expanded={ctx.open}
        aria-controls={ctx.contentId}
        data-state={ctx.open ? 'open' : 'closed'}
        data-disabled={dataAttr(ctx.disabled)}
        disabled={ctx.disabled}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (e.defaultPrevented || ctx.disabled) return;
          ctx.setOpen(!ctx.open);
        }}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export interface CollapsibleContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Render hidden content but keep it in the DOM (for animations). */
  forceMount?: boolean;
  children: ReactNode;
}

export const CollapsibleContent = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent({ forceMount, className, children, ...rest }, ref) {
    const ctx = useCollapsibleContext();
    if (!ctx.open && !forceMount) return null;
    return (
      <div
        ref={ref}
        id={ctx.contentId}
        role="region"
        aria-labelledby={ctx.triggerId}
        data-state={ctx.open ? 'open' : 'closed'}
        hidden={!ctx.open}
        className={cn(
          'overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

type CollapsibleComponent = typeof Collapsible & {
  Trigger: typeof CollapsibleTrigger;
  Content: typeof CollapsibleContent;
};

(Collapsible as CollapsibleComponent).Trigger = CollapsibleTrigger;
(Collapsible as CollapsibleComponent).Content = CollapsibleContent;

export default Collapsible as CollapsibleComponent;
