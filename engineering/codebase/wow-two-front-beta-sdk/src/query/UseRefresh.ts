import { useCallback, useEffect, useRef, useState } from 'react';

/** Defines options for `useRefresh`. */
export interface UseRefreshOptions {
  /** The shortest time `refreshing` stays true, in ms, so the skeleton swap is always seen. Default `400`. */
  readonly minDuration?: number;
}

/** The state `useRefresh` returns. */
export interface UseRefreshResult {
  /** Runs the refresh; resolves once it settles and the minimum duration has passed. */
  readonly refresh: () => Promise<void>;

  /** True from the click until the refresh settles — drive the region's `Skeleton.Group` with it. */
  readonly refreshing: boolean;
}

/**
 * Tracks a user-requested refresh, separate from background refetches, so a region can swap to its
 * skeleton and back. A refresh that answers instantly still shows the skeleton for `minDuration`, so the
 * user can tell it ran; overlapping clicks share one pending state.
 */
export function useRefresh(
  refetch: () => Promise<unknown>,
  { minDuration = 400 }: UseRefreshOptions = {},
): UseRefreshResult {
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(0);
  const mounted = useRef(true);

  // Set on every mount: StrictMode mounts, unmounts and mounts again, and a flag cleared by the first cleanup
  // would otherwise leave `refreshing` stuck on true.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    pending.current += 1;
    setRefreshing(true);
    try {
      await Promise.all([
        refetch().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, minDuration)),
      ]);
    } finally {
      pending.current -= 1;
      if (mounted.current && pending.current === 0) setRefreshing(false);
    }
  }, [refetch, minDuration]);

  return { refresh, refreshing };
}
