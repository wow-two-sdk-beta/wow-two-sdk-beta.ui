import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs, surfaceVariants, type SurfaceVariants } from '../../utils';
import { useControlled } from '../../hooks';
import { DismissableLayer, Portal, Presence, ScrollLockProvider, Slot } from '../../primitives';
import { Backdrop } from '../backdrop';
import {
  OverlayBody,
  OverlayChromeProvider,
  OverlayCloseButton,
  OverlayDescription,
  OverlayFooter,
  OverlayHeader,
  OverlayTitle,
  type OverlayChromeContextValue,
} from '../OverlayChrome';

export type DrawerSide = 'top' | 'right' | 'bottom' | 'left';

interface DrawerContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
  side: DrawerSide;
  dismissOnOutsideClick: boolean;
  dismissOnEscape: boolean;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error('Drawer.* must be used inside <Drawer>');
  return ctx;
}

export interface DrawerProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: DrawerSide;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  children: ReactNode;
}

export function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = 'right',
  dismissOnOutsideClick = true,
  dismissOnEscape = true,
  children,
}: DrawerProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const ctx = useMemo<DrawerContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      titleId,
      descriptionId,
      side,
      dismissOnOutsideClick,
      dismissOnEscape,
    }),
    [open, setOpen, titleId, descriptionId, side, dismissOnOutsideClick, dismissOnEscape],
  );

  return <DrawerContext.Provider value={ctx}>{children}</DrawerContext.Provider>;
}

export interface DrawerTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children: ReactNode;
}

export const DrawerTrigger = forwardRef<HTMLButtonElement, DrawerTriggerProps>(
  function DrawerTrigger({ asChild, onClick, children, ...rest }, forwardedRef) {
    const ctx = useDrawerContext();
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
          ctx.setOpen(true);
        }}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Full-edge slide: the panel rests at translate-0 when open and is pushed
// fully off its own edge when closed. `transition-transform` (gated on
// `motion-safe:`) animates both enter and exit via Presence's data-state flip.
const SIDE_BASE: Record<DrawerSide, string> = {
  right:
    'inset-y-0 right-0 h-full w-full border-l ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:translate-x-full',
  left:
    'inset-y-0 left-0 h-full w-full border-r ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:-translate-x-full',
  top:
    'inset-x-0 top-0 w-full border-b ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:-translate-y-full',
  bottom:
    'inset-x-0 bottom-0 w-full border-t ' +
    'motion-safe:transition-transform motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out) ' +
    'data-[state=closed]:translate-y-full',
};

const HORIZONTAL_SIZE: Record<DrawerSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-2xl',
  full: '',
};

const VERTICAL_SIZE: Record<DrawerSize, string> = {
  sm: 'max-h-[40vh]',
  md: 'max-h-[60vh]',
  lg: 'max-h-[75vh]',
  xl: 'max-h-[85vh]',
  full: 'max-h-screen',
};

/** Represents the prop surface of `Drawer.Content`. */
export interface DrawerContentProps extends HTMLAttributes<HTMLDivElement>, SurfaceVariants {
  hideBackdrop?: boolean;
  isBlurred?: boolean;
  /** Per-side max-size token. Default `md` (preserves prior behavior for right/left at `sm`-ish width via `sm:max-w-md`). */
  size?: DrawerSize;
  children: ReactNode;
}

/**
 * The full portal subtree (scroll-lock + backdrop + focus-trap + dialog panel),
 * rendered as the single child of `<Presence>`. Presence injects `data-state`
 * ("open" | "closed") + a `ref` here; both are forwarded to the dialog panel —
 * the element whose `transition-transform` end defers unmount — and `data-state`
 * is mirrored onto the backdrop so its fade runs in lock-step with the slide.
 * Keeping the whole subtree inside Presence holds the focus-trap + scroll-lock
 * active through the exit animation and releases them on unmount.
 */
interface DrawerSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  ctx: DrawerContextValue;
  hideBackdrop?: boolean;
  isBlurred?: boolean;
  chromeCtx: OverlayChromeContextValue;
  surfaceClassName?: string;
  children: ReactNode;
}

const DrawerSurface = forwardRef<HTMLDivElement, DrawerSurfaceProps>(function DrawerSurface(
  {
    ctx,
    hideBackdrop,
    isBlurred,
    chromeCtx,
    surfaceClassName,
    children,
    // `data-state` is injected by Presence; default to "open" when rendered standalone.
    'data-state': dataState = 'open',
    ...rest
  }: DrawerSurfaceProps & { 'data-state'?: 'open' | 'closed' },
  forwardedRef,
) {
  return (
    <Portal>
      <ScrollLockProvider>
        {!hideBackdrop && (
          <Backdrop
            isInline
            isBlurred={isBlurred}
            data-state={dataState}
            className={cn(
              // Backdrop fade driven by the same data-state Presence flips (motion-safe).
              'motion-safe:transition-opacity motion-safe:duration-(--duration-base) motion-safe:ease-(--ease-out)',
              'data-[state=closed]:opacity-0',
            )}
            onClick={() => {
              if (ctx.dismissOnOutsideClick) ctx.setOpen(false);
            }}
          />
        )}
        <FocusScope asChild trapped loop>
          <DismissableLayer
            isEscapeDisabled={!ctx.dismissOnEscape}
            onEscape={() => ctx.setOpen(false)}
            isOutsideClickDisabled
          >
            <div
              ref={forwardedRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ctx.titleId}
              aria-describedby={ctx.descriptionId}
              data-state={dataState}
              data-side={ctx.side}
              className={surfaceClassName}
              {...rest}
            >
              <OverlayChromeProvider value={chromeCtx}>{children}</OverlayChromeProvider>
            </div>
          </DismissableLayer>
        </FocusScope>
      </ScrollLockProvider>
    </Portal>
  );
});
DrawerSurface.displayName = 'DrawerSurface';

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  function DrawerContent(
    {
      hideBackdrop,
      isBlurred,
      variant,
      tone,
      radius,
      padding,
      elevation,
      size = 'md',
      className,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const ctx = useDrawerContext();
    const isHorizontal = ctx.side === 'right' || ctx.side === 'left';
    const sizeClass = isHorizontal ? HORIZONTAL_SIZE[size] : VERTICAL_SIZE[size];

    const close = useCallback(() => {
      ctx.setOpen(false);
      requestAnimationFrame(() => ctx.triggerRef.current?.focus());
    }, [ctx]);

    const chromeCtx = useMemo<OverlayChromeContextValue>(
      () => ({ titleId: ctx.titleId, descriptionId: ctx.descriptionId, close }),
      [ctx.titleId, ctx.descriptionId, close],
    );

    const surfaceClassName = cn(
      'fixed z-modal flex flex-col gap-4 outline-none',
      surfaceVariants({
        variant: variant ?? 'elevated',
        tone,
        radius: radius ?? 'none',
        padding: padding ?? 'xl',
        elevation: elevation ?? 3,
      }),
      SIDE_BASE[ctx.side],
      sizeClass,
      className,
    );

    // Presence keeps the subtree mounted through the exit slide, flipping
    // data-state open→closed and deferring unmount until the panel's
    // transition ends.
    return (
      <Presence isPresent={ctx.open}>
        <DrawerSurface
          ref={forwardedRef}
          ctx={ctx}
          hideBackdrop={hideBackdrop}
          isBlurred={isBlurred}
          chromeCtx={chromeCtx}
          surfaceClassName={surfaceClassName}
          {...rest}
        >
          {children}
        </DrawerSurface>
      </Presence>
    );
  },
);

// Re-export shared chrome subcomponents under the Drawer namespace.
export const DrawerHeader = OverlayHeader;
export const DrawerTitle = OverlayTitle;
export const DrawerDescription = OverlayDescription;
export const DrawerBody = OverlayBody;
export const DrawerFooter = OverlayFooter;
export const DrawerClose = OverlayCloseButton;

type DrawerComponent = typeof Drawer & {
  Trigger: typeof DrawerTrigger;
  Content: typeof DrawerContent;
  Header: typeof DrawerHeader;
  Title: typeof DrawerTitle;
  Description: typeof DrawerDescription;
  Body: typeof DrawerBody;
  Footer: typeof DrawerFooter;
  Close: typeof DrawerClose;
};

(Drawer as DrawerComponent).Trigger = DrawerTrigger;
(Drawer as DrawerComponent).Content = DrawerContent;
(Drawer as DrawerComponent).Header = DrawerHeader;
(Drawer as DrawerComponent).Title = DrawerTitle;
(Drawer as DrawerComponent).Description = DrawerDescription;
(Drawer as DrawerComponent).Body = DrawerBody;
(Drawer as DrawerComponent).Footer = DrawerFooter;
(Drawer as DrawerComponent).Close = DrawerClose;

export default Drawer as DrawerComponent;
