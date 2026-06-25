import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled, useEscape } from '../../hooks';
import {
  AnchoredPositioner,
  OverlayArrow,
  Portal,
  Presence,
  type AnchoredPositionerProps,
  type OverlayArrowProps,
} from '../../primitives';

interface HoverCardContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  show: () => void;
  hide: () => void;
  cancelHide: () => void;
  placement: AnchoredPositionerProps['placement'];
  offset: number;
}

const HoverCardContext = createContext<HoverCardContextValue | null>(null);

function useHoverCardContext() {
  const ctx = useContext(HoverCardContext);
  if (!ctx) throw new Error('HoverCard.* must be used inside <HoverCard>');
  return ctx;
}

export interface HoverCardProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  openDelay?: number;
  closeDelay?: number;
  placement?: AnchoredPositionerProps['placement'];
  offset?: number;
  children: ReactNode;
}

export function HoverCard({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  openDelay = 700,
  closeDelay = 300,
  placement = 'bottom',
  offset = 8,
  children,
}: HoverCardProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  }, []);

  const show = useCallback(() => {
    clear();
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [clear, openDelay, setOpen]);

  const hide = useCallback(() => {
    clear();
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clear, closeDelay, setOpen]);

  const cancelHide = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // Clear pending timers on unmount — avoids setState-after-unmount.
  useEffect(() => clear, [clear]);

  // WCAG 1.4.13 — hover content must be dismissible without moving the pointer.
  useEscape(() => {
    clear();
    setOpen(false);
  }, open);

  const ctx = useMemo<HoverCardContextValue>(
    () => ({ open, setOpen, triggerRef, show, hide, cancelHide, placement, offset }),
    [open, setOpen, show, hide, cancelHide, placement, offset],
  );

  return <HoverCardContext.Provider value={ctx}>{children}</HoverCardContext.Provider>;
}

export interface HoverCardTriggerProps {
  asChild?: boolean;
  children: ReactElement;
}

export function HoverCardTrigger({ children }: HoverCardTriggerProps) {
  const ctx = useHoverCardContext();
  if (!isValidElement(children)) return children;
  const trigger = children as ReactElement<{
    ref?: Ref<HTMLElement>;
    onPointerEnter?: (e: React.PointerEvent) => void;
    onPointerLeave?: (e: React.PointerEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  }> & { ref?: Ref<HTMLElement> };

  return cloneElement(trigger, {
    ref: composeRefs((node: HTMLElement | null) => {
      ctx.triggerRef.current = node;
    }, trigger.ref),
    onPointerEnter: (e: React.PointerEvent) => {
      trigger.props.onPointerEnter?.(e);
      ctx.show();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      trigger.props.onPointerLeave?.(e);
      ctx.hide();
    },
    onFocus: (e: React.FocusEvent) => {
      trigger.props.onFocus?.(e);
      ctx.show();
    },
    onBlur: (e: React.FocusEvent) => {
      trigger.props.onBlur?.(e);
      ctx.hide();
    },
  });
}

export interface HoverCardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/*
 * Presence clones its single child and injects `ref` + `data-state` onto it,
 * so that child must be the animated element. Portal/AnchoredPositioner can't
 * carry those props down to the styled div, so this forwardRef panel bridges
 * them: Presence drives this panel, the panel renders the Portal → positioner
 * tree, and forwards `ref` + the injected `data-state` (via `...rest`) onto the
 * inner div that carries the pop transition.
 */
const HoverCardPanel = forwardRef<HTMLDivElement, HoverCardContentProps>(
  function HoverCardPanel({ className, children, onPointerEnter, onPointerLeave, ...rest }, forwardedRef) {
    const ctx = useHoverCardContext();
    return (
      <Portal>
        <AnchoredPositioner
          anchor={ctx.triggerRef.current}
          placement={ctx.placement}
          offset={ctx.offset}
          className="z-dropdown"
        >
          <div
            ref={forwardedRef}
            onPointerEnter={(e) => {
              onPointerEnter?.(e);
              ctx.cancelHide();
            }}
            onPointerLeave={(e) => {
              onPointerLeave?.(e);
              ctx.hide();
            }}
            className={cn(
              'w-64 rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-none',
              'motion-safe:data-[state=open]:animate-(--animate-pop-in) motion-safe:data-[state=closed]:animate-(--animate-pop-out) motion-reduce:animate-none',
              className,
            )}
            {...rest}
          >
            {children}
          </div>
        </AnchoredPositioner>
      </Portal>
    );
  },
);

export const HoverCardContent = forwardRef<HTMLDivElement, HoverCardContentProps>(
  function HoverCardContent(props, forwardedRef) {
    const ctx = useHoverCardContext();
    return (
      <Presence isPresent={ctx.open}>
        <HoverCardPanel ref={forwardedRef} {...props} />
      </Presence>
    );
  },
);

export function HoverCardArrow({ className, ...rest }: OverlayArrowProps) {
  return <OverlayArrow className={cn('text-popover', className)} {...rest} />;
}

type HoverCardComponent = typeof HoverCard & {
  Trigger: typeof HoverCardTrigger;
  Content: typeof HoverCardContent;
  Arrow: typeof HoverCardArrow;
};

(HoverCard as HoverCardComponent).Trigger = HoverCardTrigger;
(HoverCard as HoverCardComponent).Content = HoverCardContent;
(HoverCard as HoverCardComponent).Arrow = HoverCardArrow;

export default HoverCard as HoverCardComponent;
