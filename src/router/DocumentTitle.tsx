import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

import type { RouteHandle } from './RouteConfig';

/** Defines props for the document-title syncer. */
interface DocumentTitleProps {
  /** The suffix appended after the route title — usually the app name. */
  readonly suffix?: string;
}

/** Syncs `document.title` to the deepest matched route's `handle.title`, plus an optional app suffix. */
export function DocumentTitle({ suffix }: DocumentTitleProps) {
  const matches = useMatches();

  useEffect(() => {
    const titled = [...matches].reverse().find((match) => (match.handle as RouteHandle | undefined)?.title);
    const title = (titled?.handle as RouteHandle | undefined)?.title;
    document.title = title ? (suffix ? `${title} · ${suffix}` : title) : (suffix ?? document.title);
  }, [matches, suffix]);

  return null;
}
