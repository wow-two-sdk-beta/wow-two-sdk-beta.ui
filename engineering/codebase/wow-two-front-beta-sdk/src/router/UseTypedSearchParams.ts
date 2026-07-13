import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Defines the typed search-params accessor — the current values plus a partial, merge-preserving setter. */
export interface TypedSearchParams<T extends Record<string, string>> {
  /** The current values — each key resolved from the URL, falling back to its default. */
  readonly values: T;

  /** Sets a partial subset of keys, preserving every untouched param already in the URL. */
  readonly setValues: (patch: Partial<T>) => void;
}

/**
 * Manages typed URL search params — a read merged over `defaults` plus a merge-preserving partial setter.
 * The read resolves each default key from the URL (falling back to its default); the setter patches only the
 * given keys and leaves every other param (typed or not) untouched. For dashboard filters / pagination.
 */
export function useTypedSearchParams<T extends Record<string, string>>(defaults: T): TypedSearchParams<T> {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const merged: Record<string, string> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key);
      if (raw !== null) merged[key] = raw;
    }
    return merged as T;
  }, [searchParams, defaults]);

  const setValues = useCallback(
    (patch: Partial<T>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const entries = Object.entries(patch) as [string, string | undefined][];
          for (const [key, value] of entries) {
            if (value === undefined) continue;
            next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { values, setValues };
}
