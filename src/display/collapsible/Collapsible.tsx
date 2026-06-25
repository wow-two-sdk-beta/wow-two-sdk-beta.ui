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
import { Slot, Presence } from '../../primitives';

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
  isDisabled?: boolean;
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  { open: openProp, defaultOpen = false, onOpenChange, isDisabled = false, className, children, ...rest },
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
    () => ({ open, setOpen, contentId, triggerId, disabled: isDisabled }),
    [open, setOpen, contentId, triggerId, isDisabled],
  );

  return (
    <CollapsibleContext.Provider value={ctx}>
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        data-disabled={dataAttr(isDisabled)}
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
  isForceMounted?: boolean;
  children: ReactNode;
}

/* Inner element rendered by <Presence>: receives ref + data-state via {...props}.
 * Animates content height through grid-template-rows 0fr -> 1fr (gated on
 * data-state) and layers a fade on the inner pane. Reduced-motion users get the
 * resolved height/opacity with no transition (motion-safe / motion-reduce). */
const CollapsibleContentInner = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContentInner(
    { isForceMounted, className, children, ...props },
    ref,
  ) {
    const ctx = useCollapsibleContext();
    return (
      <div
        ref={ref}
        id={ctx.contentId}
        role="region"
        aria-labelledby={ctx.triggerId}
        hidden={!ctx.open && !isForceMounted}
        className={cn(
          'grid grid-rows-[0fr] motion-safe:transition-[grid-template-rows]',
          'motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out)',
          'data-[state=open]:grid-rows-[1fr]',
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            'min-h-0 overflow-hidden',
            'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
            'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
            'motion-reduce:animate-none',
          )}
          data-state={ctx.open ? 'open' : 'closed'}
        >
          {children}
        </div>
      </div>
    );
  },
);

export const CollapsibleContent = forwardRef<HTMLDivElement, CollapsibleContentProps>(
  function CollapsibleContent(props, ref) {
    const ctx = useCollapsibleContext();
    if (props.isForceMounted) {
      return <CollapsibleContentInner ref={ref} data-state={ctx.open ? 'open' : 'closed'} {...props} />;
    }
    return (
      <Presence isPresent={ctx.open}>
        <CollapsibleContentInner ref={ref} {...props} />
      </Presence>
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
