import { lazy, type ComponentType } from 'react';

export interface RouteEntry {
  path: string;
  title: string;
  /** Lazily-loaded, default-exported page component. */
  Component: ComponentType;
}

/* Default exports keep each page in its own lazy chunk. */
export const ROUTES: RouteEntry[] = [
  { path: '/', title: 'Gallery', Component: lazy(() => import('./pages/GalleryPage')) },
  { path: '/preview', title: 'Preview board', Component: lazy(() => import('./pages/PreviewPage')) },
  { path: '/generator', title: 'Generator', Component: lazy(() => import('./pages/GeneratorPage')) },
  { path: '/export', title: 'Export', Component: lazy(() => import('./pages/ExportPage')) },
];
