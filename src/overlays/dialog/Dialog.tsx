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

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  titleId: string;
  descriptionId: string;
  role: 'dialog' | 'alertdialog';
  dismissOnOutsideClick: boolean;
  dismissOnEscape: boolean;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('Dialog.* must be used inside <Dialog>');
  return ctx;
}

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  dismissOnOutsideClick?: boolean;
  dismissOnEscape?: boolean;
  /** Internal — `AlertDialog` overrides this. */
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
}

export function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  dismissOnOutsideClick = true,
  dismissOnEscape = true,
  role = 'dialog',
  children,
}: DialogProps) {
  const [open, setOpen] = useControlled({
    controlled: openProp,
    default: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const ctx = useMemo<DialogContextValue>(
    () => ({
      open,
      setOpen,
      triggerRef,
      titleId,
      descriptionId,
      role,
      dismissOnOutsideClick,
      dismissOnEscape,
    }),
    [open, setOpen, titleId, descriptionId, role, dismissOnOutsideClick, dismissOnEscape],
  );

  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>;
}

export interface DialogTriggerProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children: ReactNode;
}

export const DialogTrigger = forwardRef<HTMLButtonElement, DialogTriggerProps>(
  function DialogTrigger({ asChild, onClick, children, ...rest }, forwardedRef) {
    const ctx = useDialogContext();
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

/** Represents the prop surface of `Dialog.Content`. */
export interface DialogContentProps extends HTMLAttributes<HTMLDivElement>, SurfaceVariants {
  /** Disables the default backdrop when true. */
  hideBackdrop?: boolean;
  /** Applies a backdrop blur. */
  isBlurred?: boolean;
  children: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    {
      hideBackdrop,
      isBlurred,
      variant,
      tone,
      radius,
      padding,
      elevation,
      className,
      children,
      ...rest
    },
    forwardedRef,
  ) {
    const ctx = useDialogContext();

    const close = useCallback(() => {
      ctx.setOpen(false);
      requestAnimationFrame(() => ctx.triggerRef.current?.focus());
    }, [ctx]);

    const chromeCtx = useMemo<OverlayChromeContextValue>(
      () => ({ titleId: ctx.titleId, descriptionId: ctx.descriptionId, close }),
      [ctx.titleId, ctx.descriptionId, close],
    );

    return (
      <Portal>
        <ScrollLockProvider>
          {/* Backdrop in its own Presence so its fade-out plays before unmount.
              `Presence` injects `data-state` + `ref` onto the cloned child, which is
              the animating node it watches for `animationend` — so each animated
              element gets its own Presence (one cloned child = one watched node). */}
          {!hideBackdrop && (
            <Presence isPresent={ctx.open}>
              <DialogBackdrop isBlurred={isBlurred} />
            </Presence>
          )}
          {/* Outside-click dismissal lives on the centering wrapper (it covers the
              backdrop): a click on the padding (target === currentTarget) = outside.
              The wrapper is the Presence-animated node — `Presence` injects
              `data-state` + `ref` onto it and watches *its own* animations (no
              subtree walk), so the wrapper carries a (transparent) fade and the
              visible pop lands on the panel via `group-data-[state=*]`. Both share
              the same token timing, so the wrapper fade gates unmount correctly. */}
          <Presence isPresent={ctx.open}>
            <div
              className={cn(
                'group fixed inset-0 z-modal grid place-items-center overflow-y-auto p-4',
                'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
                'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
              )}
              onClick={(e) => {
                if (e.target !== e.currentTarget) return;
                if (ctx.dismissOnOutsideClick) ctx.setOpen(false);
              }}
            >
              <FocusScope asChild trapped loop>
                <DismissableLayer
                  isEscapeDisabled={!ctx.dismissOnEscape}
                  onEscape={() => ctx.setOpen(false)}
                  isOutsideClickDisabled
                >
                  <div
                    ref={forwardedRef}
                    role={ctx.role}
                    aria-modal="true"
                    aria-labelledby={ctx.titleId}
                    aria-describedby={ctx.descriptionId}
                    className={cn(
                      'relative w-full max-w-lg',
                      'motion-safe:group-data-[state=open]:animate-(--animate-pop-in)',
                      'motion-safe:group-data-[state=closed]:animate-(--animate-pop-out)',
                      surfaceVariants({
                        variant: variant ?? 'elevated',
                        tone,
                        radius: radius ?? 'lg',
                        padding: padding ?? 'xl',
                        elevation,
                      }),
                      className,
                    )}
                    {...rest}
                  >
                    <OverlayChromeProvider value={chromeCtx}>{children}</OverlayChromeProvider>
                  </div>
                </DismissableLayer>
              </FocusScope>
            </div>
          </Presence>
        </ScrollLockProvider>
      </Portal>
    );
  },
);

/**
 * `Presence`-clonable backdrop: a single `forwardRef` element that spreads
 * `data-state` (injected by `Presence`) onto its node and animates the scrim
 * fade off it. Kept `open` (mount is controlled by `Presence`, not the prop) so
 * the fade-out can play before unmount.
 */
const DialogBackdrop = forwardRef<HTMLDivElement, { isBlurred?: boolean } & HTMLAttributes<HTMLDivElement>>(
  function DialogBackdrop({ isBlurred, className, ...props }, ref) {
    return (
      <Backdrop
        ref={ref}
        isInline
        isBlurred={isBlurred}
        className={cn(
          'motion-safe:data-[state=open]:animate-(--animate-fade-in)',
          'motion-safe:data-[state=closed]:animate-(--animate-fade-out)',
          className,
        )}
        {...props}
      />
    );
  },
);

// Re-export shared chrome subcomponents under the Dialog namespace.
export const DialogHeader = OverlayHeader;
export const DialogTitle = OverlayTitle;
export const DialogDescription = OverlayDescription;
export const DialogBody = OverlayBody;
export const DialogFooter = OverlayFooter;
export const DialogClose = OverlayCloseButton;

type DialogComponent = typeof Dialog & {
  Trigger: typeof DialogTrigger;
  Content: typeof DialogContent;
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Description: typeof DialogDescription;
  Body: typeof DialogBody;
  Footer: typeof DialogFooter;
  Close: typeof DialogClose;
};

(Dialog as DialogComponent).Trigger = DialogTrigger;
(Dialog as DialogComponent).Content = DialogContent;
(Dialog as DialogComponent).Header = DialogHeader;
(Dialog as DialogComponent).Title = DialogTitle;
(Dialog as DialogComponent).Description = DialogDescription;
(Dialog as DialogComponent).Body = DialogBody;
(Dialog as DialogComponent).Footer = DialogFooter;
(Dialog as DialogComponent).Close = DialogClose;

export default Dialog as DialogComponent;
