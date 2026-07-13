import type { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const DefaultStorageKey = 'app:query-cache';
const DefaultMaxAgeMs = 24 * 60 * 60_000; // 24h

/** Defines options for `setupQueryPersistence`. */
export interface SetupQueryPersistenceOptions {
  /** The `localStorage` key the dehydrated cache is written under. */
  readonly storageKey?: string;
  /** The max age of a restored cache in ms; an older cache is discarded on restore. */
  readonly maxAgeMs?: number;
  /** A cache-busting string; a mismatch discards the persisted cache. */
  readonly buster?: string;
}

/** Represents the handles returned by `setupQueryPersistence`. */
export interface QueryPersistenceHandle {
  /** Stops persisting further cache changes. */
  readonly unsubscribe: () => void;
  /** Resolves once the persisted cache has been restored into the client. */
  readonly restored: Promise<void>;
}

/**
 * Wires `localStorage` persistence for the query cache (opt-in — call from `main.tsx`); returns
 * null when there is no `window` (SSR-safe).
 *
 * Caveats to weigh before opting in:
 * - **Sensitive data** — every successful query dehydrates into `localStorage` in plain text,
 *   including authenticated user data; any script on the origin can read it. Do not enable on
 *   apps whose cache holds secrets/PII, or scope what queries cache to begin with.
 * - **Version busting** — pass `buster` (e.g. the app version) whenever a release changes cached
 *   shapes; a restored stale shape otherwise flows into typed hooks unchecked.
 * - **Quota** — a full `localStorage` makes the persister silently stop writing that snapshot
 *   (no retry strategy is wired); the app keeps working, persistence just lags.
 * - **Temporal revive** — payloads parsed via `reviveTemporal` serialize to ISO strings and are
 *   restored WITHOUT re-reviving: restored entries hold plain strings where live fetches hold
 *   `Temporal.*` objects. Don't combine persistence with `reviveTemporal` yet.
 */
export function setupQueryPersistence(
  client: QueryClient,
  options: SetupQueryPersistenceOptions = {},
): QueryPersistenceHandle | null {
  if (typeof window === 'undefined') return null;

  const { storageKey = DefaultStorageKey, maxAgeMs = DefaultMaxAgeMs, buster } = options;

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: storageKey,
  });

  const [unsubscribe, restored] = persistQueryClient({
    queryClient: client,
    persister,
    maxAge: maxAgeMs,
    buster,
  });

  return { unsubscribe, restored };
}
