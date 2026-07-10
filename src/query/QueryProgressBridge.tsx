import { useEffect, useRef } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

import { useNavigationProgress } from '../router';

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
