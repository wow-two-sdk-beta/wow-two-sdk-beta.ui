import {
  createContext,
  forwardRef,
  useContext,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { RovingFocusGroup, Slot, useRovingFocusItem } from '../../primitives';

interface ToolbarContextValue {
  orientation: 'horizontal' | 'vertical';
}

const ToolbarContext = createContext<ToolbarContextValue | null>(null);

function useToolbarContext() {
  const ctx = useContext(ToolbarContext);
  if (!ctx) throw new Error('Toolbar.* must be used inside <Toolbar>');
  return ctx;
}

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { orientation = 'horizontal', className, children, ...rest },
  ref,
) {
  return (
    <ToolbarContext.Provider value={{ orientation }}>
      <RovingFocusGroup
        ref={ref as never}
        orientation={orientation}
        loop
        role="toolbar"
        aria-orientation={orientation}
        data-orientation={orientation}
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border bg-background p-1',
          orientation === 'vertical' && 'flex-col items-stretch',
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
      aria-orientation={ctx.orientation === 'vertical' ? 'horizontal' : 'vertical'}
      className={cn(
        'shrink-0 bg-border',
        ctx.orientation === 'vertical' ? 'mx-1 h-px' : 'my-1 w-px',
      )}
      {...props}
    />
  );
}

type ToolbarComponent = typeof Toolbar & {
  Button: typeof ToolbarButton;
  Link: typeof ToolbarLink;
  Separator: typeof ToolbarSeparator;
};

(Toolbar as ToolbarComponent).Button = ToolbarButton;
(Toolbar as ToolbarComponent).Link = ToolbarLink;
(Toolbar as ToolbarComponent).Separator = ToolbarSeparator;

export default Toolbar as ToolbarComponent;
