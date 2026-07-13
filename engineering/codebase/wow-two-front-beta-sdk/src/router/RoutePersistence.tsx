import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { isSafeInternalPath } from './Guards';

/** The default localStorage key the last visited route is stored under. */
const DefaultStorageKey = 'app:lastRoute';

/** Defines props for the route persister. */
interface RoutePersistenceProps {
  /** The localStorage key the current route is stored under. */
  readonly storageKey?: string;

  /** Whether to navigate to the saved route on first mount when the app opened at its root. */
  readonly restore?: boolean;
}

/** Persists the current route to localStorage on each navigation and, when `restore` is set, returns to the saved route on first mount if the app opened at its root. */
export function RoutePersistence({ storageKey = DefaultStorageKey, restore = false }: RoutePersistenceProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const current = location.pathname + location.search;

  // Restore once, on first mount — declared before the persist effect so it reads the saved value
  // before that effect overwrites it. The ref also guards StrictMode's double-invoked mount.
  const didRestoreRef = useRef(false);
  useEffect(() => {
    if (didRestoreRef.current) return;
    didRestoreRef.current = true;
    if (!restore) return;

    const saved = readRoute(storageKey);
    // Only restore when genuinely sitting at the app root — never fight an index redirect that has
    // already moved the app off `/`. The saved value is re-validated as a same-origin root-relative
    // path: localStorage is writable by anything on the origin, so a tampered value (e.g.
    // `//evil.com`, which pushState rejects with a SecurityError) must never reach `navigate`.
    if (saved && location.pathname === '/' && isNonRootPath(saved) && isSafeInternalPath(saved)) {
      navigate(saved, { replace: true });
    }
    // Mount-only: deps intentionally empty so a later navigation can never re-trigger a restore.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on each navigation (and on the initial entry).
  useEffect(() => {
    writeRoute(storageKey, current);
  }, [storageKey, current]);

  return null;
}

/** Reads the saved route from localStorage, tolerating storage being unavailable. */
function readRoute(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Writes the current route to localStorage, tolerating storage being unavailable (private mode / quota). */
function writeRoute(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage unavailable — persistence is best-effort, so swallow.
  }
}

/** Determines whether a stored route resolves to a non-root path (ignoring any query string). */
function isNonRootPath(route: string): boolean {
  const [path] = route.split('?');
  return !!path && path !== '/';
}
