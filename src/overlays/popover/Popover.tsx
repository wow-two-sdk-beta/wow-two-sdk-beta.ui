import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs, surfaceVariants, type SurfaceVariants } from '../../utils';
import { useControlled } from '../../hooks';
import {
  AnchoredPositioner,
  DismissableLayer,
  OverlayArrow,
  Portal,
  Presence,
  Slot,
  type AnchoredPositionerProps,
  type OverlayArrowProps,
} from '../../primitives';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  /** Trigger node held in state so an initially-open popover re-renders anchored. */
  triggerNode: HTMLElement | null;
  onTriggerChange: (node: HTMLElement | null) => void;
  placement: AnchoredPositionerProps['placement'];
  offset: number;
  dismissOnOutsideClick: boolean;
  dismissOnEscape: boolean;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover.* must be used inside <Popover>');
  return ctx;
}

export interface PopoverProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: AnchoredPositionerProps['placement'];
  offset?: number;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  children: ReactNode;
}

export function Popover({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  offset = 8,
  dismissOnOutsideClick = true,
  dismissOnEscape = true,
  children,
}: PopoverProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const [triggerNode, setTriggerNode] = useState<HTMLElement | null>(null);

  const ctx = useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      triggerNode,
      onTriggerChange: setTriggerNode,
      placement,
      offset,
      dismissOnOutsideClick,
      dismissOnEscape,
    }),
    [open, setOpen, triggerNode, placement, offset, dismissOnOutsideClick, dismissOnEscape],
  );

  return <PopoverContext.Provider value={ctx}>{children}</PopoverContext.Provider>;
}

export interface PopoverTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children: ReactNode;
}

export const PopoverTrigger = forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  function PopoverTrigger({ asChild, onClick, children, ...rest }, forwardedRef) {
    const ctx = usePopoverContext();
    const { triggerRef, onTriggerChange } = ctx;
    const Component = asChild ? Slot : 'button';
    // Memoized so the callback ref isn't re-invoked (null → node) every render.
    const composedRef = useMemo(
      () =>
        composeRefs<HTMLButtonElement>(
          forwardedRef,
          triggerRef as React.MutableRefObject<HTMLButtonElement | null>,
          onTriggerChange,
        ),
      [forwardedRef, triggerRef, onTriggerChange],
    );
    return (
      <Component
        ref={composedRef as never}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={ctx.open}
        data-state={ctx.open ? 'open' : 'closed'}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.setOpen(!ctx.open);
        }}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

/** Represents the prop surface of the `Popover.Content`. */
export interface PopoverContentProps
  extends HTMLAttributes<HTMLDivElement>,
    SurfaceVariants {
  /** Skips the surface chrome (bg/border/shadow); keeps only z-index + animation. */
  isBare?: boolean;
  children: ReactNode;
}

/** Contains the default chrome width that preserves the historical look. */
const DEFAULT_WIDTH = 'w-72';

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { isBare, variant, tone, radius, padding, elevation, className, children, ...rest },
    forwardedRef,
  ) {
    const ctx = usePopoverContext();
    /* Default to lg padding when chrome is on (matches old `p-4`); consumer can override. */
    const resolvedPadding = padding ?? (isBare ? 'none' : 'lg');
    return (
      <Presence isPresent={ctx.open}>
        {/* `Presence` injects ref + data-state onto this portal root and defers
            unmount until its exit anim ends. The panel pop is driven off this
            root's state via `group-data-[state=*]` on the surface below. */}
        <PopoverPortalRoot>
          {/* z-popover (80) on the SC root (transform makes the stacking context) so a
              popover from a Dialog (z-modal, 70) paints above it — both portal to body. */}
          <AnchoredPositioner
            anchor={ctx.triggerNode}
            placement={ctx.placement}
            offset={ctx.offset}
            className="z-popover"
          >
            <FocusScope asChild trapped loop>
              <DismissableLayer
                isEscapeDisabled={!ctx.dismissOnEscape}
                onEscape={() => {
                  ctx.setOpen(false);
                  requestAnimationFrame(() => ctx.triggerRef.current?.focus());
                }}
                isOutsideClickDisabled={!ctx.dismissOnOutsideClick}
                onOutsidePointerDown={(e) => {
                  if (ctx.triggerRef.current?.contains(e.target as Node)) return;
                  ctx.setOpen(false);
                }}
              >
                <div
                  ref={forwardedRef}
                  role="dialog"
                  className={cn(
                    /* pop (fade+scale) gated on the portal-root data-state + motion-safe
                       so reduced-motion users get no movement. */
                    'outline-none',
                    'motion-safe:group-data-[state=open]:animate-(--animate-pop-in)',
                    'motion-safe:group-data-[state=closed]:animate-(--animate-pop-out) motion-reduce:animate-none',
                    !isBare &&
                      cn(
                        DEFAULT_WIDTH,
                        surfaceVariants({
                          variant,
                          tone,
                          radius,
                          padding: resolvedPadding,
                          elevation,
                        }),
                      ),
                    className,
                  )}
                  {...rest}
                >
                  {children}
                </div>
              </DismissableLayer>
            </FocusScope>
          </AnchoredPositioner>
        </PopoverPortalRoot>
      </Presence>
    );
  },
);

/**
 * `Presence`-clonable root: a single element that accepts `ref` + `data-state`
 * (injected by `Presence`) and renders inside a `Portal`. Marked `group` so the
 * panel below animates off its `data-[state]`. Holds no layout of its own
 * (`display: contents`) so the anchored positioning of children is unaffected.
 */
const PopoverPortalRoot = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function PopoverPortalRoot({ children, className, ...props }, ref) {
    return (
      <Portal>
        <div ref={ref} className={cn('group contents', className)} {...props}>
          {children}
        </div>
      </Portal>
    );
  },
);

export function PopoverArrow({ className, ...rest }: OverlayArrowProps) {
  return <OverlayArrow className={cn('text-popover', className)} {...rest} />;
}

type PopoverComponent = typeof Popover & {
  Trigger: typeof PopoverTrigger;
  Content: typeof PopoverContent;
  Arrow: typeof PopoverArrow;
};

(Popover as PopoverComponent).Trigger = PopoverTrigger;
(Popover as PopoverComponent).Content = PopoverContent;
(Popover as PopoverComponent).Arrow = PopoverArrow;

export default Popover as PopoverComponent;
