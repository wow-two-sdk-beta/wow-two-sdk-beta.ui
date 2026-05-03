import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { cn, composeRefs } from '../../utils';
import { useControlled } from '../../hooks';
import { DismissableLayer, Portal, ScrollLockProvider, Slot } from '../../primitives';
import { Backdrop } from '../backdrop';

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
        aria-haspopup={ctx.role === 'alertdialog' ? 'dialog' : 'dialog'}
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
                  {children}
                </div>
              </DismissableLayer>
            </FocusScope>
          </div>
        </ScrollLockProvider>
      </Portal>
    );
  },
);

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogHeader({ className, children, ...rest }: DialogHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...rest}>
      {children}
    </div>
  );
}

export interface DialogTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function DialogTitle({ className, children, ...rest }: DialogTitleProps) {
  const ctx = useDialogContext();
  return (
    <h2
      id={ctx.titleId}
      className={cn('text-lg font-semibold leading-none text-foreground', className)}
      {...rest}
    >
      {children}
    </h2>
  );
}

export interface DialogDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function DialogDescription({
  className,
  children,
  ...rest
}: DialogDescriptionProps) {
  const ctx = useDialogContext();
  return (
    <p id={ctx.descriptionId} className={cn('text-sm text-muted-foreground', className)} {...rest}>
      {children}
    </p>
  );
}

export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogBody({ className, children, ...rest }: DialogBodyProps) {
  return (
    <div className={cn('text-sm text-foreground', className)} {...rest}>
      {children}
    </div>
  );
}

export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DialogFooter({ className, children, ...rest }: DialogFooterProps) {
  return (
    <div
      className={cn(
        'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface DialogCloseProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children?: ReactNode;
}

export const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(function DialogClose(
  { asChild, onClick, className, children, ...rest },
  forwardedRef,
) {
  const ctx = useDialogContext();
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      ref={forwardedRef as never}
      type="button"
      aria-label={children ? undefined : 'Close'}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        ctx.setOpen(false);
        requestAnimationFrame(() => ctx.triggerRef.current?.focus());
      }}
      className={
        asChild
          ? className
          : cn(
              'absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              className,
            )
      }
      {...rest}
    >
      {children ?? <X className="h-4 w-4" />}
    </Component>
  );
});

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
