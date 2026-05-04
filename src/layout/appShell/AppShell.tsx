import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../utils';
import { useControlled, useMediaQuery } from '../../hooks';
import { Drawer, DrawerContent } from '../../overlays/drawer';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

interface AppShellContextValue {
  sidebarWidth: string;
  asideWidth: string;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  isAsideHidden: boolean;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

function useAppShellContext() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error('AppShell.* must be used inside <AppShell>');
  return ctx;
}

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebarWidth?: string;
  asideWidth?: string;
  sidebarBreakpoint?: Breakpoint;
  asideBreakpoint?: Breakpoint;
  sidebarOpen?: boolean;
  defaultSidebarOpen?: boolean;
  onSidebarOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

/**
 * Top-level page frame. Children: `AppShell.Header / Sidebar / Main / Aside /
 * Footer`. CSS-grid layout; sidebar collapses to a Drawer below
 * `sidebarBreakpoint`.
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    sidebarWidth = '240px',
    asideWidth = '280px',
    sidebarBreakpoint = 'lg',
    asideBreakpoint = 'xl',
    sidebarOpen: sidebarOpenProp,
    defaultSidebarOpen = false,
    onSidebarOpenChange,
    className,
    children,
    ...rest
  },
  ref,
) {
  const [sidebarOpen, setSidebarOpen] = useControlled({
    controlled: sidebarOpenProp,
    default: defaultSidebarOpen,
    onChange: onSidebarOpenChange,
  });

  const isSidebarCollapsed = !useMediaQuery(`(min-width: ${BREAKPOINT_PX[sidebarBreakpoint]}px)`);
  const isAsideHidden = !useMediaQuery(`(min-width: ${BREAKPOINT_PX[asideBreakpoint]}px)`);

  const ctx = useMemo<AppShellContextValue>(
    () => ({
      sidebarWidth,
      asideWidth,
      sidebarOpen,
      setSidebarOpen,
      isSidebarCollapsed,
      isAsideHidden,
    }),
    [sidebarWidth, asideWidth, sidebarOpen, setSidebarOpen, isSidebarCollapsed, isAsideHidden],
  );

  const gridTemplate = isSidebarCollapsed
    ? `'header header' auto 'main main' 1fr 'footer footer' auto / 1fr`
    : `'header header' auto 'sidebar main' 1fr 'sidebar footer' auto / ${sidebarWidth} 1fr`;

  return (
    <AppShellContext.Provider value={ctx}>
      <div
        ref={ref}
        className={cn('grid min-h-svh bg-background text-foreground', className)}
        style={{ gridTemplate }}
        {...rest}
      >
        <a
          href="#app-shell-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>
        {children}
      </div>
    </AppShellContext.Provider>
  );
});

export type AppShellHeaderProps = HTMLAttributes<HTMLElement>;

export const AppShellHeader = forwardRef<HTMLElement, AppShellHeaderProps>(
  function AppShellHeader({ className, ...rest }, ref) {
    return (
      <header
        ref={ref}
        role="banner"
        className={cn(
          'sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 [grid-area:header]',
          className,
        )}
        {...rest}
      />
    );
  },
);

export type AppShellSidebarProps = HTMLAttributes<HTMLElement>;

export const AppShellSidebar = forwardRef<HTMLElement, AppShellSidebarProps>(
  function AppShellSidebar({ className, children, ...rest }, ref) {
    const ctx = useAppShellContext();

    if (ctx.isSidebarCollapsed) {
      return (
        <Drawer open={ctx.sidebarOpen} onOpenChange={ctx.setSidebarOpen} side="left">
          <DrawerContent className="w-72 max-w-[80%]">
            <nav className={cn('flex h-full flex-col', className)}>{children}</nav>
          </DrawerContent>
        </Drawer>
      );
    }
    return (
      <aside
        ref={ref}
        className={cn(
          'sticky top-14 hidden h-[calc(100svh-3.5rem)] overflow-y-auto border-r border-border bg-card [grid-area:sidebar] lg:flex',
          className,
        )}
        {...rest}
      >
        <nav className="flex h-full w-full flex-col p-3">{children}</nav>
      </aside>
    );
  },
);

export type AppShellMainProps = HTMLAttributes<HTMLElement>;

export const AppShellMain = forwardRef<HTMLElement, AppShellMainProps>(
  function AppShellMain({ className, children, ...rest }, ref) {
    return (
      <main
        ref={ref}
        id="app-shell-main"
        className={cn(
          'flex flex-col [grid-area:main] focus:outline-none',
          className,
        )}
        tabIndex={-1}
        {...rest}
      >
        {children}
      </main>
    );
  },
);

export type AppShellContentProps = HTMLAttributes<HTMLDivElement>;

export const AppShellContent = forwardRef<HTMLDivElement, AppShellContentProps>(
  function AppShellContent({ className, ...rest }, ref) {
    return <div ref={ref} className={cn('flex-1 overflow-y-auto p-6', className)} {...rest} />;
  },
);

export type AppShellAsideProps = HTMLAttributes<HTMLElement>;

export const AppShellAside = forwardRef<HTMLElement, AppShellAsideProps>(
  function AppShellAside({ className, ...rest }, ref) {
    const ctx = useAppShellContext();
    if (ctx.isAsideHidden) return null;
    return (
      <aside
        ref={ref}
        style={{ width: ctx.asideWidth }}
        className={cn(
          'sticky top-14 h-[calc(100svh-3.5rem)] shrink-0 overflow-y-auto border-l border-border bg-card p-4',
          className,
        )}
        {...rest}
      />
    );
  },
);

export type AppShellFooterProps = HTMLAttributes<HTMLElement>;

export const AppShellFooter = forwardRef<HTMLElement, AppShellFooterProps>(
  function AppShellFooter({ className, ...rest }, ref) {
    return (
      <footer
        ref={ref}
        role="contentinfo"
        className={cn(
          'border-t border-border bg-card px-4 py-3 text-sm text-muted-foreground [grid-area:footer]',
          className,
        )}
        {...rest}
      />
    );
  },
);

type AppShellComponent = typeof AppShell & {
  Header: typeof AppShellHeader;
  Sidebar: typeof AppShellSidebar;
  Main: typeof AppShellMain;
  Content: typeof AppShellContent;
  Aside: typeof AppShellAside;
  Footer: typeof AppShellFooter;
};

(AppShell as AppShellComponent).Header = AppShellHeader;
(AppShell as AppShellComponent).Sidebar = AppShellSidebar;
(AppShell as AppShellComponent).Main = AppShellMain;
(AppShell as AppShellComponent).Content = AppShellContent;
(AppShell as AppShellComponent).Aside = AppShellAside;
(AppShell as AppShellComponent).Footer = AppShellFooter;

export function useAppShell() {
  return useAppShellContext();
}

export default AppShell as AppShellComponent;
