import { Suspense, useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import {
  AppShell,
  AppShellContent,
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
} from '@wow-two-beta/ui/layout';
import { Toaster } from '@wow-two-beta/ui/feedback';
import { Button } from '@wow-two-beta/ui/actions';
import { ROUTES } from './routes';
import { ThemeProvider } from './theme/ThemeContext';
import { ThemeBodySync } from './chrome/ThemeBodySync';
import { SidebarNav } from './chrome/SidebarNav';
import { ThemeToggle } from './chrome/ThemeToggle';
import { RouteHeader } from './chrome/RouteHeader';
import { CommandMenu } from './chrome/CommandMenu';

function PageFallback() {
  return <div className="p-8 text-sm text-subtle-foreground">Loading…</div>;
}

function AppRoutes() {
  return (
    <Routes>
      {ROUTES.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}
    </Routes>
  );
}

/* Showcase shell — the chrome dogfoods the library: AppShell frame, global
   Toaster, Cmd+K CommandPalette route jumper, NavItem sidebar rows. */
export function App() {
  const location = useLocation();
  const active = ROUTES.find((r) => r.path === location.pathname);

  // Mobile drawer state for the AppShell sidebar (collapses below `lg`).
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (active?.bare) {
    return (
      <ThemeProvider>
        <ThemeBodySync />
        <Toaster />
        <Suspense fallback={<PageFallback />}>
          <AppRoutes />
        </Suspense>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ThemeBodySync />
      <Toaster />
      <AppShell
        sidebarOpen={sidebarOpen}
        onSidebarOpenChange={setSidebarOpen}
        sidebarBreakpoint="lg"
      >
        <AppShellHeader>
          <Button
            variant="ghost"
            tone="neutral"
            size="sm"
            shape="square"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </Button>
          <div className="text-sm font-semibold">@wow-two-beta/ui showcase</div>
          <div className="ml-auto flex items-center gap-2">
            <CommandMenu />
          </div>
        </AppShellHeader>

        <AppShellSidebar>
          <SidebarNav />
          <div className="mt-auto pt-4">
            <ThemeToggle />
          </div>
        </AppShellSidebar>

        <AppShellMain className="min-w-0">
          {active && <RouteHeader entry={active} />}
          <AppShellContent className="min-w-0">
            <Suspense fallback={<PageFallback />}>
              <AppRoutes />
            </Suspense>
          </AppShellContent>
        </AppShellMain>
      </AppShell>
    </ThemeProvider>
  );
}
