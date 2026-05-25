import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useRef,
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
  Slot,
  type AnchoredPositionerProps,
  type OverlayArrowProps,
} from '../../primitives';

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
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

  const ctx = useMemo<PopoverContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      placement,
      offset,
      dismissOnOutsideClick,
      dismissOnEscape,
    }),
    [open, setOpen, placement, offset, dismissOnOutsideClick, dismissOnEscape],
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
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={composeRefs(forwardedRef, ctx.triggerRef as React.MutableRefObject<HTMLButtonElement | null>) as never}
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
  bare?: boolean;
  children: ReactNode;
}

/** Contains the default chrome width that preserves the historical look. */
const DEFAULT_WIDTH = 'w-72';

export const PopoverContent = forwardRef<HTMLDivElement, PopoverContentProps>(
  function PopoverContent(
    { bare, variant, tone, radius, padding, elevation, className, children, ...rest },
    forwardedRef,
  ) {
    const ctx = usePopoverContext();
    if (!ctx.open) return null;
    /* Default to lg padding when chrome is on (matches old `p-4`); consumer can override. */
    const resolvedPadding = padding ?? (bare ? 'none' : 'lg');
    return (
      <Portal>
        {/* z-index sits on the SC root — transform creates the stacking context. */}
        <AnchoredPositioner
          anchor={ctx.triggerRef.current}
          placement={ctx.placement}
          offset={ctx.offset}
          className="z-dropdown"
        >
          <FocusScope asChild trapped loop>
            <DismissableLayer
              disableEscape={!ctx.dismissOnEscape}
              onEscape={() => {
                ctx.setOpen(false);
                requestAnimationFrame(() => ctx.triggerRef.current?.focus());
              }}
              disableOutsideClick={!ctx.dismissOnOutsideClick}
              onOutsidePointerDown={(e) => {
                if (ctx.triggerRef.current?.contains(e.target as Node)) return;
                ctx.setOpen(false);
              }}
            >
              <div
                ref={forwardedRef}
                role="dialog"
                data-state="open"
                className={cn(
                  'outline-none animate-in fade-in-0 zoom-in-95',
                  !bare &&
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
