import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled, useEscape, useId, useReducedMotion } from '../../hooks';
import {
  AnchoredPositioner,
  Portal,
  Presence,
  type AnchoredPositionerProps,
} from '../../primitives';

/**
 * Animated tooltip body. `forwardRef` + `{...props}` spread so `Presence` can
 * inject its `ref` (for transition/animation-end detection) and the
 * `data-state="open" | "closed"` that drives the enter/exit keyframes.
 * Motion is gated on `data-state` and behind `motion-safe:` so reduced-motion
 * users get an instant show/hide.
 */
const TooltipContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'z-tooltip rounded-md bg-inverse px-2.5 py-1.5 text-xs text-inverse-foreground shadow-md',
        'motion-safe:data-[state=open]:animate-(--animate-pop-in)',
        'motion-safe:data-[state=closed]:animate-(--animate-pop-out)',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
TooltipContent.displayName = 'TooltipContent';

export interface TooltipProps {
  /** Tooltip body. */
  content: ReactNode;
  /** Single child element — the trigger. Receives event handlers + ref. */
  children: ReactElement;
  /** Floating UI placement. Default `top`. */
  placement?: AnchoredPositionerProps['placement'];
  /** Delay before opening on hover, in ms. Default 700. */
  openDelay?: number;
  /** Delay before closing on leave, in ms. Default 0. */
  closeDelay?: number;
  /** Controlled open state. */
  open?: boolean;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean;
  /** Fires on every open-state change (hover, focus, Escape). */
  onOpenChange?: (open: boolean) => void;
  /** Disable rendering even on hover (e.g. when content is empty). */
  isDisabled?: boolean;
}

/**
 * Hover-/focus-triggered tooltip. Wraps a single child as the trigger; the
 * tooltip body renders into a Portal positioned by Floating UI. Default
 * delays mirror the OS pattern (700ms in, 0 out). Escape dismisses without
 * moving focus (WCAG 1.4.13); the trigger is described by the tooltip via
 * `aria-describedby` while open.
 */
export function Tooltip({
  content,
  children,
  placement = 'top',
  openDelay = 700,
  closeDelay = 0,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  isDisabled,
}: TooltipProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const tooltipId = useId('tooltip');
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = null;
    closeTimer.current = null;
  };
  const show = () => {
    clear();
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  };
  const hide = () => {
    clear();
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  /* Clear pending timers on unmount. */
  useEffect(
    () => () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  /* WCAG 1.4.13 — Escape dismisses immediately, without moving focus. */
  useEscape(() => {
    clear();
    setOpen(false);
  }, open);

  const reducedMotion = useReducedMotion();
  const visible = !isDisabled && open && !!content;

  /* Keep the Portal + positioner mounted while the exit animation plays.
     Becomes true with `visible`; cleared on the body's pop-out `animationend`
     (see `onAnimationEnd` below). With reduced motion no exit animation runs,
     so tear the shell down immediately on close. */
  const [mounted, setMounted] = useState(visible);
  useEffect(() => {
    if (visible) setMounted(true);
    else if (reducedMotion) setMounted(false);
  }, [visible, reducedMotion]);

  if (!isValidElement(children)) return children;
  const trigger = children as ReactElement<{
    ref?: Ref<HTMLElement>;
    'aria-describedby'?: string;
    onPointerEnter?: (e: React.PointerEvent) => void;
    onPointerLeave?: (e: React.PointerEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
  }> & { ref?: Ref<HTMLElement> };

  const cloned = cloneElement(trigger, {
    ref: composeRefs(setAnchor, trigger.ref),
    'aria-describedby': visible
      ? [trigger.props['aria-describedby'], tooltipId].filter(Boolean).join(' ')
      : trigger.props['aria-describedby'],
    onPointerEnter: (e: React.PointerEvent) => {
      trigger.props.onPointerEnter?.(e);
      show();
    },
    onPointerLeave: (e: React.PointerEvent) => {
      trigger.props.onPointerLeave?.(e);
      hide();
    },
    onFocus: (e: React.FocusEvent) => {
      trigger.props.onFocus?.(e);
      show();
    },
    onBlur: (e: React.FocusEvent) => {
      trigger.props.onBlur?.(e);
      hide();
    },
  });

  return (
    <>
      {cloned}
      {mounted && (
        <Portal>
          <AnchoredPositioner
            anchor={anchor}
            placement={placement}
            offset={6}
            /* Exit animation bubbles up from TooltipContent; once the
               closed-state pop-out ends, tear down the Portal shell. Also
               covers the reduced-motion path, where no animation runs and
               Presence has already unmounted the body. */
            onAnimationEnd={() => {
              if (!visible) setMounted(false);
            }}
          >
            <Presence isPresent={visible}>
              <TooltipContent id={tooltipId} role="tooltip">
                {content}
              </TooltipContent>
            </Presence>
          </AnchoredPositioner>
        </Portal>
      )}
    </>
  );
}
