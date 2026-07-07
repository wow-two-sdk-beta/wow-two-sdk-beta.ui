import {
  createContext,
  forwardRef,
  useContext,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn, Orientation } from '../../../foundation/utils';
import { RovingFocusGroup, Slot, useRovingFocusItem } from '../../../foundation/primitives';

interface ToolbarContextValue {
  orientation: Orientation;
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext() {
  const ctx = useContext(ToolbarContext);
  if (!ctx) throw new Error('Toolbar.* must be used inside <Toolbar>');
  return ctx;
}

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation;
}

const ToolbarRoot = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { orientation = Orientation.Horizontal, className, children, ...rest },
  ref,
) {
  return (
    <ToolbarContext.Provider value={{ orientation }}>
      <RovingFocusGroup
        ref={ref as never}
        orientation={orientation}
        canLoop
        role="toolbar"
        aria-orientation={orientation}
        data-orientation={orientation}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border bg-background p-1',
          orientation === Orientation.Vertical && 'flex-col items-stretch',
          className,
        )}
        {...rest}
      >
        {children}
      </RovingFocusGroup>
    </ToolbarContext.Provider>
  );
});

export interface ToolbarButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  asChild?: boolean;
  children: ReactNode;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton({ asChild, className, onKeyDown, onFocus, children, ...rest }, ref) {
    const roving = useRovingFocusItem();
    const Component = asChild ? Slot : 'button';
    return (
      <Component
        ref={(node: HTMLButtonElement | null) => {
          roving.ref(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        type={asChild ? undefined : 'button'}
        tabIndex={roving.tabIndex}
        onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
          onFocus?.(e);
          roving.onFocus();
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          roving.onKeyDown(e);
        }}
        className={cn(
          asChild
            ? className
            : cn(
                'inline-flex h-8 items-center justify-center rounded-sm px-2 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
                className,
              ),
        )}
        {...rest}
      >
        {children}
      </Component>
    );
  },
);

export interface ToolbarLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
  children: ReactNode;
}

export const ToolbarLink = forwardRef<HTMLAnchorElement, ToolbarLinkProps>(function ToolbarLink(
  { className, onKeyDown, onFocus, children, ...rest },
  ref,
) {
  const roving = useRovingFocusItem();
  return (
    <a
      ref={(node) => {
        roving.ref(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      tabIndex={roving.tabIndex}
      onFocus={(e) => {
        onFocus?.(e);
        roving.onFocus();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        roving.onKeyDown(e);
      }}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-sm px-2 text-sm text-foreground underline-offset-2 transition-colors hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
});

export function ToolbarSeparator(props: HTMLAttributes<HTMLDivElement>) {
  const ctx = useToolbarContext();
  return (
    <div
      role="separator"
      aria-orientation={ctx.orientation === Orientation.Vertical ? 'horizontal' : 'vertical'}
      className={cn(
        'shrink-0 bg-border',
        ctx.orientation === Orientation.Vertical ? 'mx-1 h-px' : 'my-1 w-px self-stretch',
      )}
      {...props}
    />
  );
}

export const Toolbar = Object.assign(ToolbarRoot, {
  Button: ToolbarButton,
  Link: ToolbarLink,
  Separator: ToolbarSeparator,
});

export default Toolbar;
