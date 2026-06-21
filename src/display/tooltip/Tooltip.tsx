import {
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { cn, composeRefs } from '../../utils';
import { useControlled, useEscape, useId } from '../../hooks';
import {
  AnchoredPositioner,
  Portal,
  type AnchoredPositionerProps,
} from '../../primitives';

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

  const visible = !isDisabled && open && !!content;

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
      {visible && (
        <Portal>
          <AnchoredPositioner anchor={anchor} placement={placement} offset={6}>
            <div
              id={tooltipId}
              role="tooltip"
              className={cn(
                'z-tooltip rounded-md bg-inverse px-2.5 py-1.5 text-xs text-inverse-foreground shadow-md',
                'animate-in fade-in-0 zoom-in-95',
              )}
            >
              {content}
            </div>
          </AnchoredPositioner>
        </Portal>
      )}
    </>
  );
}
