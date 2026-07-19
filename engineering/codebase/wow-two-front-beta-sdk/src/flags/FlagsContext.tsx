import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createFlagClient, type FlagClient, type FlagErrorListener } from './FlagClient';
import type { FlagProvider } from './FlagProvider';
import type { EvaluationContext, FlagValue } from './FlagTypes';

/*
 * The React seam over `FlagClient` — the provider + hook pattern used by `foundation/i18n`'s
 * `LocaleContext`, including its standalone fallback: `useFlag` works with no provider mounted
 * (every flag returns the caller's default), so an SDK component may read a flag without forcing
 * every consuming app to wire one.
 *
 * NOTE ON NAMING: `FlagsProvider` (plural) is this React component; `FlagProvider` (singular,
 * `FlagProvider.ts`) is the backend adapter it evaluates against. Same split as OpenFeature.
 *
 * RE-EVALUATION ON CONTEXT CHANGE. The client is created once and never re-created — swapping it
 * mid-life would drop its subscribers — so a context change cannot propagate by client identity.
 * Instead the provider subscribes to the client and bumps a `revision` into React state; the context
 * VALUE carries that revision, so every consumer re-renders and re-reads. Evaluation is a
 * synchronous map lookup, so the hooks re-evaluate during render with no memo — cheaper than the
 * bookkeeping a memo would need, and never stale.
 *
 * The `context` prop syncs in through an effect rather than at construction, so a fresh object
 * literal per render is safe: `setContext` no-ops when the merge changes nothing, so a parent that
 * rebuilds its context literal every render neither refetches nor re-renders flag consumers.
 */

/** The client plus the counter that re-renders consumers when the evaluation context moves. */
interface FlagsContextValue {
  readonly client: FlagClient;
  readonly revision: number;
}

const FlagsContext = createContext<FlagsContextValue | undefined>(undefined);

/** Backs the hooks when no `FlagsProvider` is mounted — an empty static provider, so every flag returns the caller's default. */
const STANDALONE_CONTEXT: FlagsContextValue = { client: createFlagClient(), revision: 0 };

/** Defines the props for {@link FlagsProvider}. */
export interface FlagsProviderProps {
  /** An existing client to serve — the app-wide instance shared with non-React callers. Takes precedence over `provider` / `onError`. */
  readonly client?: FlagClient;

  /** The flag source to build a client around, when no `client` is passed. Read once, on mount. */
  readonly provider?: FlagProvider;

  /** The evaluation context. Kept in sync on every change — a fresh object literal per render is safe. */
  readonly context?: EvaluationContext;

  /** Receives evaluation faults, when no `client` is passed. Read once, on mount. */
  readonly onError?: FlagErrorListener;

  /** The subtree that can read flags. */
  readonly children: ReactNode;
}

/**
 * Provides flag evaluation to every descendant and re-renders them whenever the evaluation context
 * changes — including changes made imperatively through `client.setContext(…)` outside React.
 *
 * ```tsx
 * <FlagsProvider client={flags} context={{ targetingKey: user.id, plan: user.plan }}>
 *   <App />
 * </FlagsProvider>
 * ```
 */
export function FlagsProvider({ client, provider, context, onError, children }: FlagsProviderProps): ReactNode {
  // Lazy `useState` initializer, not `useMemo`: the client must be created exactly once for the
  // component's life, and a memo is allowed to be dropped and re-run.
  const [ownClient] = useState<FlagClient>(() => client ?? createFlagClient({ provider, context, onError }));
  const activeClient = client ?? ownClient;

  const [revision, setRevision] = useState(0);

  useEffect(
    () => activeClient.subscribe(() => setRevision((current) => current + 1)),
    [activeClient],
  );

  useEffect(() => {
    if (context !== undefined) activeClient.setContext(context);
  }, [activeClient, context]);

  const value = useMemo<FlagsContextValue>(() => ({ client: activeClient, revision }), [activeClient, revision]);

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}

/** Reads the flag client. Works without a {@link FlagsProvider} — falls back to an empty one, where every flag returns the caller's default. */
export function useFlags(): FlagClient {
  return (useContext(FlagsContext) ?? STANDALONE_CONTEXT).client;
}

/**
 * Reads one flag's value, re-evaluating whenever the evaluation context changes. The typed path is
 * picked from `defaultValue`, which also types the result — `useFlag('newNav', false)` is `boolean`,
 * `useFlag('limits', { max: 10 })` is that object type.
 */
export function useFlag<TValue extends FlagValue>(key: string, defaultValue: TValue): TValue {
  return useFlags().getValue(key, defaultValue);
}
