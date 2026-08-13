import { dehydrate, hydrate, type DehydratedState, type QueryClient } from '@tanstack/vue-query';

const DefaultStorageKey = 'app:query-cache';
const DefaultMaxAgeMs = 24 * 60 * 60_000; // 24h
const WriteThrottleMs = 1_000;

/** The envelope written to storage — the dehydrated cache plus what restore has to validate before trusting it. */
interface PersistedSnapshot {
  readonly buster: string;
  readonly timestamp: number;
  readonly state: DehydratedState;
}

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
 * Wires `localStorage` persistence for the query cache (opt-in — call from `main.ts`); returns null
 * when there is no `window` (SSR-safe).
 *
 * Built on `dehydrate` / `hydrate` straight out of `@tanstack/vue-query` rather than on the
 * `persist-client` + `sync-storage-persister` package pair the React version used: those two are
 * separate installs, and the whole of what they add over this is an async persister interface this
 * synchronous store does not need. The restore is therefore SYNCHRONOUS — the cache is already
 * hydrated when the call returns, and `restored` is an already-settled promise kept for API parity.
 *
 * Caveats to weigh before opting in:
 * - **Sensitive data** — every successful query dehydrates into `localStorage` in plain text,
 *   including authenticated user data; any script on the origin can read it. Do not enable on apps
 *   whose cache holds secrets/PII, or scope what queries cache to begin with.
 * - **Version busting** — pass `buster` (e.g. the app version) whenever a release changes cached
 *   shapes; a restored stale shape otherwise flows into typed hooks unchecked.
 * - **Quota** — a full `localStorage` makes the write silently fail (no retry strategy is wired);
 *   the app keeps working, persistence just lags.
 * - **Temporal revive** — payloads parsed via `reviveTemporal` serialize to ISO strings and are
 *   restored WITHOUT re-reviving: restored entries hold plain strings where live fetches hold
 *   `Temporal.*` objects. Don't combine persistence with `reviveTemporal` yet.
 */
export function setupQueryPersistence(
  client: QueryClient,
  options: SetupQueryPersistenceOptions = {},
): QueryPersistenceHandle | null {
  if (typeof window === 'undefined') return null;

  const { storageKey = DefaultStorageKey, maxAgeMs = DefaultMaxAgeMs, buster = '' } = options;

  restore(client, storageKey, maxAgeMs, buster);

  // Throttled: a burst of cache events (one query settling touches the cache several times) must not
  // serialize the whole cache once per event.
  let timer: ReturnType<typeof setTimeout> | null = null;
  const schedule = (): void => {
    if (timer !== null) return;
    timer = setTimeout(() => {
      timer = null;
      write(client, storageKey, buster);
    }, WriteThrottleMs);
  };

  const unsubscribeQueries = client.getQueryCache().subscribe(schedule);
  const unsubscribeMutations = client.getMutationCache().subscribe(schedule);

  return {
    unsubscribe: () => {
      unsubscribeQueries();
      unsubscribeMutations();
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    },
    restored: Promise.resolve(),
  };
}

/** Hydrates the client from storage when the snapshot is present, current, and matches the buster. */
function restore(client: QueryClient, storageKey: string, maxAgeMs: number, buster: string): void {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;

    const snapshot = JSON.parse(raw) as PersistedSnapshot;
    const isStale = Date.now() - snapshot.timestamp > maxAgeMs;
    if (snapshot.buster !== buster || isStale) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    hydrate(client, snapshot.state);
  } catch {
    // Unreadable / unparseable / storage unavailable — a missing cache is always a valid state.
  }
}

/** Serializes the dehydrated cache into storage, tolerating storage being unavailable (private mode / quota). */
function write(client: QueryClient, storageKey: string, buster: string): void {
  try {
    const snapshot: PersistedSnapshot = { buster, timestamp: Date.now(), state: dehydrate(client) };
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort — swallow.
  }
}
