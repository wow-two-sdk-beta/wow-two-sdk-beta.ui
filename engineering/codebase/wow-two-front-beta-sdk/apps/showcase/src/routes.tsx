import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export type RouteGroup = 'Home' | 'Screens' | 'Galleries' | 'Meta';

export interface RouteEntry {
  path: string;
  title: string;
  group: RouteGroup;
  /** Key into `manifest.gen.json` routes map — page module id under `src/`. */
  module: string;
  Component: LazyExoticComponent<ComponentType>;
  /** Render without the AppShell chrome (e.g. auth). */
  bare?: boolean;
}

/* Single source of truth: drives the sidebar, CommandPalette items,
   RouteHeader, and the coverage manifest keys. */
export const ROUTES: RouteEntry[] = [
  { path: '/', title: 'Home', group: 'Home', module: 'screens/landing', Component: lazy(() => import('./screens/landing/LandingScreen')) },

  { path: '/app/dashboard', title: 'Dashboard', group: 'Screens', module: 'screens/dashboard', Component: lazy(() => import('./screens/dashboard/DashboardScreen')) },
  { path: '/app/settings', title: 'Settings', group: 'Screens', module: 'screens/settings', Component: lazy(() => import('./screens/settings/SettingsScreen')) },
  { path: '/app/chat', title: 'Chat', group: 'Screens', module: 'screens/chat', Component: lazy(() => import('./screens/chat/ChatScreen')) },
  { path: '/app/projects', title: 'Projects', group: 'Screens', module: 'screens/projects', Component: lazy(() => import('./screens/projects/ProjectsScreen')) },
  { path: '/app/editor', title: 'Editor', group: 'Screens', module: 'screens/editor', Component: lazy(() => import('./screens/editor/EditorScreen')) },
  { path: '/app/media', title: 'Media', group: 'Screens', module: 'screens/media', Component: lazy(() => import('./screens/media/MediaScreen')) },
  { path: '/app/onboarding', title: 'Onboarding', group: 'Screens', module: 'screens/onboarding', Component: lazy(() => import('./screens/onboarding/OnboardingScreen')) },
  { path: '/app/billing', title: 'Billing', group: 'Screens', module: 'screens/billing', Component: lazy(() => import('./screens/billing/BillingScreen')) },
  { path: '/app/inbox', title: 'Inbox', group: 'Screens', module: 'screens/inbox', Component: lazy(() => import('./screens/inbox/InboxScreen')) },
  { path: '/auth', title: 'Auth', group: 'Screens', module: 'screens/auth', bare: true, Component: lazy(() => import('./screens/auth/AuthScreen')) },

  { path: '/galleries/actions', title: 'Actions', group: 'Galleries', module: 'galleries/ActionsGallery', Component: lazy(() => import('./galleries/ActionsGallery')) },
  { path: '/galleries/display', title: 'Display', group: 'Galleries', module: 'galleries/DisplayGallery', Component: lazy(() => import('./galleries/DisplayGallery')) },
  { path: '/galleries/feedback', title: 'Feedback', group: 'Galleries', module: 'galleries/FeedbackGallery', Component: lazy(() => import('./galleries/FeedbackGallery')) },
  { path: '/galleries/forms', title: 'Forms', group: 'Galleries', module: 'galleries/FormsGallery', Component: lazy(() => import('./galleries/FormsGallery')) },
  { path: '/galleries/layout', title: 'Layout', group: 'Galleries', module: 'galleries/LayoutGallery', Component: lazy(() => import('./galleries/LayoutGallery')) },
  { path: '/galleries/nav', title: 'Nav', group: 'Galleries', module: 'galleries/NavGallery', Component: lazy(() => import('./galleries/NavGallery')) },
  { path: '/galleries/overlays', title: 'Overlays', group: 'Galleries', module: 'galleries/OverlaysGallery', Component: lazy(() => import('./galleries/OverlaysGallery')) },
  { path: '/galleries/primitives', title: 'Primitives', group: 'Galleries', module: 'galleries/PrimitivesGallery', Component: lazy(() => import('./galleries/PrimitivesGallery')) },

  { path: '/coverage', title: 'Coverage', group: 'Meta', module: 'coverage/CoveragePage', Component: lazy(() => import('./coverage/CoveragePage')) },
];
