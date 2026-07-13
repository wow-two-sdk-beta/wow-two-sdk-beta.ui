import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

/** Defines the navigation-progress controls plus the ref-counted manual busy flag exposed to app code. */
export interface NavigationProgressState {
  /** The ref-counted busy flag — true while at least one manual span is in flight. */
  readonly isBusy: boolean;

  /** Starts a manual busy span; returns an idempotent function that ends only that span. */
  readonly begin: () => () => void;

  /** Ends one manual busy span — the raw counterpart to `begin`, clamped at zero. */
  readonly end: () => void;

  /** Tracks a promise as a manual busy span — begins now, ends when it settles; resolves with the promise's value. */
  readonly track: <T>(promise: Promise<T>) => Promise<T>;
}

const ProgressContext = createContext<NavigationProgressState | null>(null);

/** Defines props for the navigation-progress provider. */
interface ProgressProviderProps {
  /** The subtree that can drive and observe the shared manual busy state. */
  readonly children: ReactNode;
}

/** Renders the navigation-progress context provider — ref-counts manual busy spans for its descendants. */
export function ProgressProvider({ children }: ProgressProviderProps) {
  const countRef = useRef(0);
  const [isBusy, setIsBusy] = useState(false);

  const sync = useCallback(() => {
    setIsBusy(countRef.current > 0);
  }, []);

  const begin = useCallback(() => {
    countRef.current += 1;
    sync();
    let ended = false;
    return () => {
      if (ended) return;
      ended = true;
      countRef.current = Math.max(0, countRef.current - 1);
      sync();
    };
  }, [sync]);

  const end = useCallback(() => {
    countRef.current = Math.max(0, countRef.current - 1);
    sync();
  }, [sync]);

  const track = useCallback(
    <T>(promise: Promise<T>): Promise<T> => {
      const done = begin();
      return promise.finally(done);
    },
    [begin],
  );

  const value = useMemo<NavigationProgressState>(
    () => ({ isBusy, begin, end, track }),
    [isBusy, begin, end, track],
  );

  return createElement(ProgressContext.Provider, { value }, children);
}

/** @internal Reads the navigation-progress state, or null when rendered outside a `ProgressProvider`. */
export function useOptionalNavigationProgress(): NavigationProgressState | null {
  return useContext(ProgressContext);
}

/** Provides access to the navigation-progress controls (begin / end / track) from the nearest `ProgressProvider`. */
export function useNavigationProgress(): NavigationProgressState {
  const context = useOptionalNavigationProgress();
  if (context === null) {
    throw new Error('useNavigationProgress must be used within a <ProgressProvider>.');
  }
  return context;
}
