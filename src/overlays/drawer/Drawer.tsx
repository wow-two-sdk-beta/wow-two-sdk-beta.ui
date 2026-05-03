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
                {children}
              </div>
            </DismissableLayer>
          </FocusScope>
        </ScrollLockProvider>
      </Portal>
    );
  },
);

export interface DrawerHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function DrawerHeader({ className, children, ...rest }: DrawerHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...rest}>
      {children}
    </div>
  );
}

export function DrawerTitle({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  const ctx = useDrawerContext();
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

export function DrawerDescription({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }) {
  const ctx = useDrawerContext();
  return (
    <p id={ctx.descriptionId} className={cn('text-sm text-muted-foreground', className)} {...rest}>
      {children}
    </p>
  );
}

export function DrawerBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn('flex-1 overflow-y-auto text-sm text-foreground', className)} {...rest}>
      {children}
    </div>
  );
}

export function DrawerFooter({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface DrawerCloseProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children?: ReactNode;
}

export const DrawerClose = forwardRef<HTMLButtonElement, DrawerCloseProps>(function DrawerClose(
  { asChild, onClick, className, children, ...rest },
  forwardedRef,
) {
  const ctx = useDrawerContext();
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
