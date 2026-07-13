import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, composeRefs } from '../../../foundation/utils';
import { Slot } from '../../../foundation/primitives';
import {
  Menu,
  MenuItem,
  MenuGroup,
  MenuLabel,
  MenuSeparator,
  type MenuProps,
} from '../menu';

interface ContextMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  anchor: HTMLElement | null;
  setAnchor: (el: HTMLElement | null) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  /** Element to hand focus back to on close — captured before the open gesture moves focus. */
  restoreFocusRef: React.MutableRefObject<HTMLElement | null>;
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null);

function useContextMenuContext() {
  const ctx = useContext(ContextMenuContext);
  if (!ctx) throw new Error('ContextMenu.* must be used inside <ContextMenu>');
  return ctx;
}

export interface ContextMenuProps {
  children: ReactNode;
}

/** Build a zero-size virtual element at coordinates to anchor Floating UI. */
function makeVirtualAnchor(x: number, y: number): HTMLElement {
  const el = document.createElement('div');
  el.style.position = 'fixed';
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.width = '0px';
  el.style.height = '0px';
  el.style.pointerEvents = 'none';
  document.body.appendChild(el);
  return el;
}

function ContextMenuRoot({ children }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchorState] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const restoreRafRef = useRef(0);

  const setAnchor = useCallback((el: HTMLElement | null) => {
    setAnchorState((prev) => {
      if (prev && prev.parentNode === document.body) prev.remove();
      return el;
    });
  }, []);

  // Cancel a pending focus-restore loop if the component unmounts mid-close.
  useEffect(() => () => cancelAnimationFrame(restoreRafRef.current), []);

  const handleSetOpen = useCallback(
    (next: boolean) => {
      // The trigger is a non-focusable div, so there is no trigger to hand
      // focus back to (APG wants focus returned on close). The trigger
      // captures the pre-gesture active element into `restoreFocusRef` on
      // pointerdown (the browser's mousedown focus fixup may have already
      // blurred it by the time `contextmenu` fires); fall back to the
      // current active element for non-pointer opens.
      if (next && !open) {
        cancelAnimationFrame(restoreRafRef.current);
        restoreFocusRef.current ??=
          document.activeElement instanceof HTMLElement && document.activeElement !== document.body
            ? document.activeElement
            : null;
      }
      setOpen(next);
      if (!next) {
        setAnchor(null);
        const restoreTarget = restoreFocusRef.current;
        restoreFocusRef.current = null;
        // The menu stays mounted (and focus-trapped) through its exit
        // animation, yanking focus straight back into itself — so retry each
        // frame until the restore sticks (bounded; the exit lasts a few
        // hundred ms at most). Reopening cancels the loop.
        if (restoreTarget) {
          let attempts = 0;
          const tryRestore = () => {
            restoreTarget.focus();
            if (document.activeElement !== restoreTarget && attempts++ < 30) {
              restoreRafRef.current = requestAnimationFrame(tryRestore);
            }
          };
          restoreRafRef.current = requestAnimationFrame(tryRestore);
        }
      }
    },
    [open, setAnchor],
  );

  // Remove the body-appended virtual anchor when it is replaced or on unmount.
  useEffect(() => {
    if (!anchor) return;
    return () => {
      if (anchor.parentNode === document.body) anchor.remove();
    };
  }, [anchor]);

  const ctx = useMemo<ContextMenuContextValue>(
    () => ({ open, setOpen: handleSetOpen, anchor, setAnchor, triggerRef, restoreFocusRef }),
    [open, handleSetOpen, anchor, setAnchor],
  );

  return <ContextMenuContext.Provider value={ctx}>{children}</ContextMenuContext.Provider>;
}
ContextMenuRoot.displayName = 'ContextMenu';

export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  isDisabled?: boolean;
  children: ReactNode;
}

export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger(
    { asChild, isDisabled, onContextMenu, onPointerDown, onPointerCancel, onPointerUp, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useContextMenuContext();
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const Component = asChild ? Slot : 'div';

    const handleContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onContextMenu?.(e);
        if (e.defaultPrevented || isDisabled) return;
        e.preventDefault();
        ctx.setAnchor(makeVirtualAnchor(e.clientX, e.clientY));
        ctx.setOpen(true);
      },
      [ctx, isDisabled, onContextMenu],
    );

    const clearLongPress = useCallback(() => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }, []);

    // Clear a pending long-press timer if the trigger unmounts mid-press.
    useEffect(() => () => clearLongPress(), [clearLongPress]);

    return (
      <Component
        ref={composeRefs(forwardedRef, ctx.triggerRef) as never}
        onContextMenu={handleContextMenu}
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerDown?.(e);
          // Capture the focus-restore target before the browser's mousedown
          // focus fixup blurs it (this trigger is a non-focusable div, so
          // the press moves focus to <body> before `contextmenu` fires).
          // Only for gestures that can open the menu: right button / touch.
          if (!isDisabled && !ctx.open && (e.button === 2 || e.pointerType === 'touch')) {
            ctx.restoreFocusRef.current =
              document.activeElement instanceof HTMLElement && document.activeElement !== document.body
                ? document.activeElement
                : null;
          }
          if (e.defaultPrevented || isDisabled || e.pointerType !== 'touch') return;
          const x = e.clientX;
          const y = e.clientY;
          longPressTimer.current = setTimeout(() => {
            ctx.setAnchor(makeVirtualAnchor(x, y));
            ctx.setOpen(true);
          }, 600);
        }}
        onPointerUp={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerUp?.(e);
          clearLongPress();
        }}
        onPointerCancel={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerCancel?.(e);
          clearLongPress();
        }}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export interface ContextMenuContentProps {
  className?: string;
  placement?: MenuProps['placement'];
  offset?: number;
  'aria-label'?: string;
  children: ReactNode;
}

export function ContextMenuContent({
  className,
  placement = 'bottom-start',
  offset = 2,
  'aria-label': ariaLabel,
  children,
}: ContextMenuContentProps) {
  const ctx = useContextMenuContext();
  return (
    <Menu
      open={ctx.open}
      anchor={ctx.anchor}
      onClose={() => ctx.setOpen(false)}
      placement={placement}
      offset={offset}
      aria-label={ariaLabel}
      // Enter-only pop: the surface mounts when `open` flips true, so the
      // anim fires once on mount. motion-safe gates it for reduced-motion.
      // (Exit anim is owned by the shared Menu's unmount gate — see note below.)
      className={cn('motion-safe:animate-(--animate-pop-in)', className)}
    >
      {children}
    </Menu>
  );
}

export const ContextMenu = Object.assign(ContextMenuRoot, {
  Trigger: ContextMenuTrigger,
  Content: ContextMenuContent,
  Item: MenuItem,
  Group: MenuGroup,
  Label: MenuLabel,
  Separator: MenuSeparator,
});

export default ContextMenu;
