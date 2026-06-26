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
import { ThemeStudioProvider } from './theme/ThemeContext';
import { SidebarNav } from './chrome/SidebarNav';
import { ThemeControls } from './chrome/ThemeControls';

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

/* Theme-studio shell — dogfoods the library chrome (AppShell, NavItem sidebar,
   global Toaster) while the ThemeStudioProvider drives the active theme on the
   root wrapper + <body>. */
export function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <ThemeStudioProvider>
      <Toaster />
      <AppShell
        isSidebarOpen={sidebarOpen}
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
          <div className="text-sm font-semibold">@wow-two-beta/ui theme studio</div>
          <div className="ml-auto">
            <ThemeControls />
          </div>
        </AppShellHeader>

        <AppShellSidebar>
          <SidebarNav />
        </AppShellSidebar>

        <AppShellMain className="min-w-0">
          <AppShellContent className="min-w-0">
            <Suspense fallback={<PageFallback />}>
              <AppRoutes />
            </Suspense>
          </AppShellContent>
        </AppShellMain>
      </AppShell>
    </ThemeStudioProvider>
  );
}
