import { useEffect, useRef, useState } from 'react';
import { useLocation, useMatches } from 'react-router-dom';

import type { RouteHandle } from './RouteConfig';

/** Defines props for the route announcer. */
interface RouteAnnouncerProps {
  /** Whether to skip the focus reset and announcement on the very first mount. */
  readonly skipInitial?: boolean;
}

/** Resets focus to the main content and announces the newly navigated page title through a polite, visually-hidden live region; skips the first mount. */
export function RouteAnnouncer({ skipInitial = true }: RouteAnnouncerProps) {
  const location = useLocation();
  const matches = useMatches();
  const [message, setMessage] = useState('');

  // Deepest matched route title (mirrors DocumentTitle), kept in a ref so the navigation effect
  // reads the latest value while firing only when the location entry actually changes.
  const titleRef = useRef('');
  const titled = [...matches].reverse().find((match) => (match.handle as RouteHandle | undefined)?.title);
  titleRef.current = (titled?.handle as RouteHandle | undefined)?.title ?? '';

  // Announce + focus once per navigation entry. `location.key` uniquely tags each entry, so the
  // guard also absorbs StrictMode's double-invoked mount effect (same key → no-op).
  const lastKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const isFirstRun = lastKeyRef.current === null;
    if (isFirstRun && skipInitial) {
      lastKeyRef.current = location.key;
      return;
    }
    if (lastKeyRef.current === location.key) return;
    lastKeyRef.current = location.key;

    focusMainContent();
    setMessage(titleRef.current || document.title);
  }, [location.key, skipInitial]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

/** Moves keyboard and screen-reader focus to the main content — the shell `<main>`, else any `<main>`, else the page `<h1>`. */
function focusMainContent() {
  const target =
    document.getElementById('app-shell-main') ??
    document.querySelector<HTMLElement>('main') ??
    document.querySelector<HTMLElement>('h1');
  if (!target) return;
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
}
