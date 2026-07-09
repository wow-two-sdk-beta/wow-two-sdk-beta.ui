import { Outlet, ScrollRestoration } from 'react-router-dom';

import { DocumentMeta } from './DocumentMeta';
import { DocumentTitle } from './DocumentTitle';
import { NavigationProgress, NavigationProgressMode } from './NavigationProgress';
import { PageViewTracker, type PageView } from './PageViewTracker';
import { RouteAnnouncer } from './RouteAnnouncer';
import { RoutePersistence } from './RoutePersistence';

/** Defines props for the router root. */
interface AppRootProps {
  /** Whether to restore scroll position across navigations. */
  readonly scrollRestoration: boolean;

  /** The document-title suffix (usually the app name); omit to leave route titles unsuffixed. */
  readonly titleSuffix?: string;

  /** Emits a page-view on each navigation (analytics sink); omit to mount no tracker. */
  readonly onPageView?: (view: PageView) => void;
}

/** Renders the router root — scroll restoration, title / announce / persistence / analytics / progress, and the matched route's `<Outlet>`. */
export function AppRoot({ scrollRestoration, titleSuffix, onPageView }: AppRootProps) {
  return (
    <>
      {scrollRestoration && <ScrollRestoration />}
      <DocumentTitle suffix={titleSuffix} />
      <DocumentMeta />
      <RouteAnnouncer />
      <RoutePersistence />
      {onPageView && <PageViewTracker onPageView={onPageView} />}
      <NavigationProgress mode={NavigationProgressMode.Both} />
      <Outlet />
    </>
  );
}
