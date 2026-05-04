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
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { DismissableLayer, Portal, ScrollLockProvider, Slot } from '../../primitives';
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

const SIDE_CLASSES: Record<DrawerSide, string> = {
  right:
    'inset-y-0 right-0 h-full w-full sm:max-w-sm border-l animate-in slide-in-from-right',
  left: 'inset-y-0 left-0 h-full w-full sm:max-w-sm border-r animate-in slide-in-from-left',
  top: 'inset-x-0 top-0 w-full max-h-[85vh] border-b animate-in slide-in-from-top',
  bottom: 'inset-x-0 bottom-0 w-full max-h-[85vh] border-t animate-in slide-in-from-bottom',
};

export interface DrawerContentProps extends HTMLAttributes<HTMLDivElement> {
  hideBackdrop?: boolean;
  blur?: boolean;
  children: ReactNode;
}

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(
  function DrawerContent(
    { hideBackdrop, blur, className, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useDrawerContext();

    const close = useCallback(() => {
      ctx.setOpen(false);
      requestAnimationFrame(() => ctx.triggerRef.current?.focus());
    }, [ctx]);

    const chromeCtx = useMemo<OverlayChromeContextValue>(
      () => ({ titleId: ctx.titleId, descriptionId: ctx.descriptionId, close }),
      [ctx.titleId, ctx.descriptionId, close],
    );

    if (!ctx.open) return null;
    return (
      <Portal>
        <ScrollLockProvider>
          {!hideBackdrop && (
            <Backdrop
              inline
              blur={blur}
              onClick={() => {
                if (ctx.dismissOnOutsideClick) ctx.setOpen(false);
              }}
            />
          )}
          <FocusScope asChild trapped loop>
            <DismissableLayer
              disableEscape={!ctx.dismissOnEscape}
              onEscape={() => ctx.setOpen(false)}
              disableOutsideClick
            >
              <div
                ref={forwardedRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={ctx.titleId}
                aria-describedby={ctx.descriptionId}
                data-state="open"
                data-side={ctx.side}
                className={cn(
                  'fixed z-50 flex flex-col gap-4 border-border bg-background p-6 shadow-lg outline-none',
                  SIDE_CLASSES[ctx.side],
                  className,
                )}
                {...rest}
              >
                <OverlayChromeProvider value={chromeCtx}>{children}</OverlayChromeProvider>
              </div>
            </DismissableLayer>
          </FocusScope>
        </ScrollLockProvider>
      </Portal>
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
