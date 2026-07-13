import { useEffect, useRef } from 'react';
import { useLocation, useMatches } from 'react-router-dom';

import type { RouteHandle } from './RouteConfig';

/** Represents a single page-view event — the resolved pathname and the deepest matched route title. */
export interface PageView {
  /** The pathname navigated to. */
  readonly pathname: string;

  /** The deepest matched route's `handle.title`, when one is set. */
  readonly title?: string;
}

/** Defines props for the page-view analytics tracker. */
interface PageViewTrackerProps {
  /** Emits a page-view on mount and on each subsequent navigation. */
  readonly onPageView: (view: PageView) => void;
}

/** Renders nothing; emits a page-view (pathname + matched `handle.title`) on mount and on each navigation. */
export function PageViewTracker({ onPageView }: PageViewTrackerProps) {
  const location = useLocation();
  const matches = useMatches();

  // Hold the latest callback in a ref so an inline prop can't force a re-fire, and so a
  // navigation always reports through the current handler without listing it as a dependency.
  const onPageViewRef = useRef(onPageView);
  onPageViewRef.current = onPageView;

  // Emit once per history entry. `location.key` uniquely tags each entry, so revalidations
  // (which refresh `matches` identity without navigating) and StrictMode's double-invoked
  // mount effect can't double-report the same view.
  const lastKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastKeyRef.current === location.key) return;
    lastKeyRef.current = location.key;

    const titled = [...matches].reverse().find((match) => (match.handle as RouteHandle | undefined)?.title);
    const title = (titled?.handle as RouteHandle | undefined)?.title;
    onPageViewRef.current({ pathname: location.pathname, title });
  }, [location, matches]);

  return null;
}
