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
import { cn, composeRefs } from '../../../foundation/utils';
import { Presence, Slot } from '../../../foundation/primitives';
import { useControlled, useReducedMotion } from '../../../foundation/hooks';
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
  /** Which item takes focus on open — the trigger sets it per gesture (APG: ArrowUp → last). */
  openFocusRef: React.MutableRefObject<'first' | 'last'>;
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

function DropdownMenuRoot({
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
  const openFocusRef = useRef<'first' | 'last'>('first');

  const ctx = useMemo<DropdownMenuContextValue>(
    () => ({ open, setOpen, triggerRef, triggerNode, setTriggerNode, openFocusRef, placement, offset }),
    [open, setOpen, triggerNode, placement, offset],
  );

  return <DropdownMenuContext.Provider value={ctx}>{children}</DropdownMenuContext.Provider>;
}
DropdownMenuRoot.displayName = 'DropdownMenu';

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
        ctx.openFocusRef.current = 'first';
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
          // APG menu-button pattern: ArrowUp-open focuses the last item.
          ctx.openFocusRef.current = e.key === 'ArrowUp' ? 'last' : 'first';
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
 * and `data-state` actually land here. Because Presence's cloned `ref` replaces
 * the element's own `ref` prop, DropdownMenuContent reaches the panel node via
 * the separate `panelRef` prop instead.
 */
const DropdownMenuPanel = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { panelRef?: React.Ref<HTMLDivElement> }
>(
  function DropdownMenuPanel({ className, children, panelRef, ...props }, ref) {
    return (
      <div
        ref={composeRefs(ref, panelRef)}
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
  const panelRef = useRef<HTMLDivElement | null>(null);
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

  /* ArrowUp-open focuses the LAST enabled item (APG menu-button pattern);
     the trigger arms `openFocusRef` per gesture and this consumes it. Other
     opens leave it at 'first' and FocusScope's default first-tabbable
     autofocus applies. */
  const focusLastEnabledItem = useCallback(
    (panel: HTMLElement) => {
      if (ctx.openFocusRef.current !== 'last') return;
      ctx.openFocusRef.current = 'first';
      const items = panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])');
      items[items.length - 1]?.focus();
    },
    [ctx.openFocusRef],
  );

  /* Mount path: the panel enters the DOM one commit after `mounted` flips
     (Portal is SSR-inert), so run off the ref attach — it lands before
     FocusScope's autofocus effect, which then skips itself because focus
     already sits inside the scope. */
  const handlePanelRef = useCallback(
    (node: HTMLDivElement | null) => {
      panelRef.current = node;
      if (node) focusLastEnabledItem(node);
    },
    [focusLastEnabledItem],
  );

  /* Reopen path: an open while the exit animation still has the panel
     mounted re-fires no ref, so consume the pending gesture here. */
  useEffect(() => {
    if (!ctx.open || !panelRef.current) return;
    focusLastEnabledItem(panelRef.current);
  }, [ctx.open, focusLastEnabledItem]);

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
          panelRef={handlePanelRef}
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

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: MenuItem,
  Group: MenuGroup,
  Label: MenuLabel,
  Separator: MenuSeparator,
});

export default DropdownMenu;
