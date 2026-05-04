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

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Disable the default backdrop. */
  hideBackdrop?: boolean;
  /** Apply backdrop blur. */
  blur?: boolean;
  children: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  function DialogContent(
    { hideBackdrop, blur, className, children, ...rest },
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
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
            <FocusScope asChild trapped loop>
              <DismissableLayer
                disableEscape={!ctx.dismissOnEscape}
                onEscape={() => ctx.setOpen(false)}
                disableOutsideClick
              >
                <div
                  ref={forwardedRef}
                  role={ctx.role}
                  aria-modal="true"
                  aria-labelledby={ctx.titleId}
                  aria-describedby={ctx.descriptionId}
                  data-state="open"
                  className={cn(
                    'relative w-full max-w-lg rounded-lg border border-border bg-background p-6 shadow-lg outline-none animate-in fade-in-0 zoom-in-95',
                    className,
                  )}
                  {...rest}
                >
                  <OverlayChromeProvider value={chromeCtx}>{children}</OverlayChromeProvider>
                </div>
              </DismissableLayer>
            </FocusScope>
          </div>
        </ScrollLockProvider>
      </Portal>
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
