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

  useEffect(() => {
    const titled = [...matches].reverse().find((match) => (match.handle as RouteHandle | undefined)?.title);
    const title = (titled?.handle as RouteHandle | undefined)?.title;
    onPageViewRef.current({ pathname: location.pathname, title });
  }, [location, matches]);

  return null;
}
