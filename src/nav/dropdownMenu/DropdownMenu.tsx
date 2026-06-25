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
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { Presence, Slot } from '../../primitives';
import { useControlled, useReducedMotion } from '../../hooks';
import {
  Menu,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  type MenuProps,
} from '../menu';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>;
  /** Trigger node kept in state so anchored content re-renders once the ref attaches. */
  triggerNode: HTMLButtonElement | null;
  setTriggerNode: (node: HTMLButtonElement | null) => void;
  placement: MenuProps['placement'];
  offset: number;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const ctx = useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu.* must be used inside <DropdownMenu>');
  return ctx;
}

export interface DropdownMenuProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: MenuProps['placement'];
  offset?: number;
  children: ReactNode;
}

export function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  offset = 6,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [triggerNode, setTriggerNode] = useState<HTMLButtonElement | null>(null);

  const ctx = useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, triggerRef, triggerNode, setTriggerNode, placement, offset }),
    [open, setOpen, triggerNode, placement, offset],
  );

  return <DropdownMenuContext.Provider value={ctx}>{children}</DropdownMenuContext.Provider>;
}

export interface DropdownMenuTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Render the trigger as the single child (e.g., `<Button>`). */
  asChild?: boolean;
  children: ReactNode;
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  function DropdownMenuTrigger(
    { asChild, onClick, onKeyDown, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useDropdownMenuContext();
    const Component = asChild ? Slot : 'button';

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        ctx.setOpen(!ctx.open);
      },
      [ctx, onClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx.setOpen(true);
        }
      },
      [ctx, onKeyDown],
    );

    return (
      <Component
        ref={composeRefs(forwardedRef, ctx.triggerRef, ctx.setTriggerNode) as never}
        type="button"
        aria-haspopup="menu"
        aria-expanded={ctx.open}
        data-state={ctx.open ? 'open' : 'closed'}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export interface DropdownMenuContentProps {
  className?: string;
  'aria-label'?: string;
  children: ReactNode;
}

/**
 * Animated panel handed to `Menu` as its child. `Presence` clones `data-state`
 * ("open" | "closed") + a `ref` onto this element, so the pop tokens below run
 * gated on that state. forwardRef + `{...props}` spread are required so the ref
 * and `data-state` actually land here.
 */
const DropdownMenuPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function DropdownMenuPanel({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          /* pop (fade + slight scale) gated on data-state; motion-safe so
             reduced-motion users get no movement. */
          'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
          'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
          'motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

export function DropdownMenuContent({
  className,
  'aria-label': ariaLabel,
  children,
}: DropdownMenuContentProps) {
  const ctx = useDropdownMenuContext();
  const reducedMotion = useReducedMotion();
  /* Keep `Menu` (positioner / focus scope / dismiss layer) mounted while the
     pop-out plays — `Menu` hard-unmounts on `!open`, which would kill the exit.
     Opening flips this true synchronously; closing defers the unmount until the
     panel's exit animation ends (`onAnimationEnd` below). Under reduced motion
     no animation fires, so drop it on the next frame instead. */
  const [mounted, setMounted] = useState(ctx.open);
  useEffect(() => {
    if (ctx.open) {
      setMounted(true);
      return;
    }
    if (!reducedMotion) return;
    const raf = requestAnimationFrame(() => setMounted(false));
    return () => cancelAnimationFrame(raf);
  }, [ctx.open, reducedMotion]);

  if (!mounted) return null;

  return (
    <Menu
      open={mounted}
      anchor={ctx.triggerNode}
      onClose={() => {
        ctx.setOpen(false);
        requestAnimationFrame(() => ctx.triggerRef.current?.focus());
      }}
      placement={ctx.placement}
      offset={ctx.offset}
      aria-label={ariaLabel}
    >
      <Presence isPresent={ctx.open}>
        <DropdownMenuPanel
          className={className}
          onAnimationEnd={() => {
            /* Drop `Menu` once the exit animation completes. */
            if (!ctx.open) setMounted(false);
          }}
        >
          {children}
        </DropdownMenuPanel>
      </Presence>
    </Menu>
  );
}

type DropdownMenuComponent = typeof DropdownMenu & {
  Trigger: typeof DropdownMenuTrigger;
  Content: typeof DropdownMenuContent;
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

(DropdownMenu as DropdownMenuComponent).Trigger = DropdownMenuTrigger;
(DropdownMenu as DropdownMenuComponent).Content = DropdownMenuContent;
(DropdownMenu as DropdownMenuComponent).Item = MenuItem;
(DropdownMenu as DropdownMenuComponent).Group = MenuGroup;
(DropdownMenu as DropdownMenuComponent).Label = MenuLabel;
(DropdownMenu as DropdownMenuComponent).Separator = MenuSeparator;

export default DropdownMenu as DropdownMenuComponent;
