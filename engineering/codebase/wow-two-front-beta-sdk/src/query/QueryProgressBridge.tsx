import { useEffect, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

// Deep import (not the `../router` barrel): the barrel statically imports react-router-dom, and a
// barrel import here would merge the whole router graph into the shared chunk `/query` loads —
// breaking `/query`'s isolation from the OPTIONAL rrd peer. `UseNavigationProgress` is plain React.
import { useNavigationProgress } from '../router/UseNavigationProgress';

// Mount inside BOTH a `QueryProvider` (for the React Query hooks) and a `ProgressProvider`
// (for `useNavigationProgress`, which THROWS when rendered outside one). Renders nothing — it
// only wires effects, driving `<NavigationProgress variant="heartbeat" mode="manual" />` while a
// backend request is in flight.

/** Lights the router's manual heartbeat while React Query has any fetch or mutation in flight. */
export function QueryProgressBridge(): null {
  const activity = useIsFetching() + useIsMutating();
  const { begin } = useNavigationProgress();
  const endRef = useRef<(() => void) | null>(null);

  // Open a manual busy span on 0→>0, close it on >0→0.
  useEffect(() => {
    if (activity > 0 && endRef.current === null) {
      endRef.current = begin();
    } else if (activity === 0 && endRef.current !== null) {
      endRef.current();
      endRef.current = null;
    }
  }, [activity, begin]);

  // Close any still-open span when the bridge unmounts mid-request.
  useEffect(
    () => () => {
      endRef.current?.();
      endRef.current = null;
    },
    [],
  );

  return null;
}
