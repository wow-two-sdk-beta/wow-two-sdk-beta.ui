import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { composeRefs } from '../../utils';
import { Slot } from '../../primitives';
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

/**
 * Build a virtual element at coordinates — Floating UI accepts a
 * getBoundingClientRect-only object as a "reference".
 */
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

export function ContextMenu({ children }: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchorState] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const setAnchor = useCallback((el: HTMLElement | null) => {
    setAnchorState((prev) => {
      if (prev && prev.parentNode === document.body) prev.remove();
      return el;
    });
  }, []);

  const handleSetOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) setAnchor(null);
    },
    [setAnchor],
  );

  const ctx = useMemo<ContextMenuContextValue>(
    () => ({ open, setOpen: handleSetOpen, anchor, setAnchor, triggerRef }),
    [open, handleSetOpen, anchor, setAnchor],
  );

  return <ContextMenuContext.Provider value={ctx}>{children}</ContextMenuContext.Provider>;
}

export interface ContextMenuTriggerProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export const ContextMenuTrigger = forwardRef<HTMLDivElement, ContextMenuTriggerProps>(
  function ContextMenuTrigger(
    { asChild, disabled, onContextMenu, onPointerDown, onPointerCancel, onPointerUp, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useContextMenuContext();
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const Component = asChild ? Slot : 'div';

    const handleContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onContextMenu?.(e);
        if (e.defaultPrevented || disabled) return;
        e.preventDefault();
        ctx.setAnchor(makeVirtualAnchor(e.clientX, e.clientY));
        ctx.setOpen(true);
      },
      [ctx, disabled, onContextMenu],
    );

    const clearLongPress = useCallback(() => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }, []);

    return (
      <Component
        ref={composeRefs(forwardedRef, ctx.triggerRef) as never}
        onContextMenu={handleContextMenu}
        onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => {
          onPointerDown?.(e);
          if (e.defaultPrevented || disabled || e.pointerType !== 'touch') return;
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
      className={className}
    >
      {children}
    </Menu>
  );
}

type ContextMenuComponent = typeof ContextMenu & {
  Trigger: typeof ContextMenuTrigger;
  Content: typeof ContextMenuContent;
  Item: typeof MenuItem;
  Group: typeof MenuGroup;
  Label: typeof MenuLabel;
  Separator: typeof MenuSeparator;
};

(ContextMenu as ContextMenuComponent).Trigger = ContextMenuTrigger;
(ContextMenu as ContextMenuComponent).Content = ContextMenuContent;
(ContextMenu as ContextMenuComponent).Item = MenuItem;
(ContextMenu as ContextMenuComponent).Group = MenuGroup;
(ContextMenu as ContextMenuComponent).Label = MenuLabel;
(ContextMenu as ContextMenuComponent).Separator = MenuSeparator;

export default ContextMenu as ContextMenuComponent;
