// Shared header / title / description / body / footer / close subcomponents
// for Dialog and Drawer. Co-located in `overlays/` as a domain-internal helper.
//
// Each consuming overlay (Dialog, Drawer) wraps its content with
// `OverlayChromeProvider`, supplying the `titleId`, `descriptionId`, and a
// `close()` action. The shared subcomponents read from this context.
//
// Naming convention: `Overlay*` for shared chrome pieces; consumers re-export
// them under their own name (e.g. `Dialog.Header = OverlayHeader`).

import {
  createContext,
  forwardRef,
  useContext,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils';
import { Slot } from '../primitives';

export interface OverlayChromeContextValue {
  titleId: string;
  descriptionId: string;
  /** Closes the overlay and returns focus to the trigger. */
  close: () => void;
}

const OverlayChromeContext = createContext<OverlayChromeContextValue | null>(null);

export const OverlayChromeProvider = OverlayChromeContext.Provider;

function useOverlayChromeContext() {
  const ctx = useContext(OverlayChromeContext);
  if (!ctx)
    throw new Error(
      'Overlay chrome subcomponents must be used inside an OverlayChromeProvider (Dialog / Drawer)',
    );
  return ctx;
}

export interface OverlayHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function OverlayHeader({ className, children, ...rest }: OverlayHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-1.5', className)} {...rest}>
      {children}
    </div>
  );
}

export interface OverlayTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function OverlayTitle({ className, children, ...rest }: OverlayTitleProps) {
  const ctx = useOverlayChromeContext();
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

export interface OverlayDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export function OverlayDescription({
  className,
  children,
  ...rest
}: OverlayDescriptionProps) {
  const ctx = useOverlayChromeContext();
  return (
    <p
      id={ctx.descriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...rest}
    >
      {children}
    </p>
  );
}

export interface OverlayBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function OverlayBody({ className, children, ...rest }: OverlayBodyProps) {
  return (
    <div className={cn('text-sm text-foreground', className)} {...rest}>
      {children}
    </div>
  );
}

export interface OverlayFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function OverlayFooter({ className, children, ...rest }: OverlayFooterProps) {
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

export interface OverlayCloseButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children?: ReactNode;
}

export const OverlayCloseButton = forwardRef<HTMLButtonElement, OverlayCloseButtonProps>(
  function OverlayCloseButton(
    { asChild, onClick, className, children, ...rest },
    forwardedRef,
  ) {
    const ctx = useOverlayChromeContext();
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={forwardedRef as never}
        type="button"
        aria-label={children ? undefined : 'Close'}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          ctx.close();
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
  },
);
