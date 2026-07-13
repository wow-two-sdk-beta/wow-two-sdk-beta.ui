import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import type { Endpoint } from './Endpoints';
import { toApiError } from './ToApiError';

/** Defines one cached query an optimistic mutation patches — where it lives and how it changes. */
export interface OptimisticTarget<TVars, TCached = unknown> {
  /** Locates the cached entry to patch — a query key, or an endpoint def (patched at its `key`). */
  readonly key: QueryKey | Endpoint<TCached>;

  /**
   * Produces the next cached value from the current one and the mutation vars — pure, no side effects.
   * `current` is `undefined` when the key holds no data yet; returning a value then seeds the entry
   * (and rollback removes the seed).
   */
  // Method syntax on purpose: its bivariant parameters let targets of different `TCached` shapes
  // (each annotating its own `current`) share one `targets` array typed `OptimisticTarget<TVars>[]`.
  apply(current: TCached | undefined, vars: TVars): TCached;
}

/** Defines options for `useOptimisticMutation`. */
export interface UseOptimisticMutationOptions<TData, TVars> {
  /** Performs the mutation against the backend. */
  readonly mutationFn: (vars: TVars) => Promise<TData>;

  /** The cached queries this mutation patches — each is cancelled, snapshotted, and applied before the request fires, then rolled back on error. */
  readonly targets: readonly OptimisticTarget<TVars>[];

  /** Invalidates every target key once the mutation settles (success or error) so the server truth reconciles the patch — `true` when omitted. */
  readonly invalidateOnSettle?: boolean;
}

/** A per-target snapshot taken before the patch — the unit of rollback. */
interface TargetSnapshot {
  readonly queryKey: QueryKey;
  readonly previous: unknown;
}

/** Resolves a target locator to its query key — unwraps an endpoint def, passes a bare key through. */
function resolveKey(key: QueryKey | Endpoint<unknown>): QueryKey {
  return 'queryFn' in key ? key.key : key;
}

/** Manages an optimistic mutation — the canonical RQ v5 flow in the house shape: cancel + snapshot + patch every target on mutate, roll the patches back on error, reconcile with the server on settle. `useAppMutation` stays the passive default. */
export function useOptimisticMutation<TData, TVars>({
  mutationFn,
  targets,
  invalidateOnSettle = true,
}: UseOptimisticMutationOptions<TData, TVars>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVars, readonly TargetSnapshot[]>({
    mutationFn,
    onMutate: async (vars) => {
      // Cancel in-flight fetches first so a late server response can't clobber the patch.
      await Promise.all(
        targets.map((target) => queryClient.cancelQueries({ queryKey: resolveKey(target.key) })),
      );

      // Snapshot, then patch. A later mutation on the same key snapshots this patch — rollbacks chain.
      return targets.map((target) => {
        const queryKey = resolveKey(target.key);
        const previous = queryClient.getQueryData(queryKey);
        queryClient.setQueryData(queryKey, () => target.apply(previous, vars));
        return { queryKey, previous };
      });
    },
    onError: (_error, _vars, snapshots) => {
      // Restore each target exactly — a seeded entry (no previous) is removed, since RQ ignores `setQueryData(key, undefined)`.
      for (const { queryKey, previous } of snapshots ?? []) {
        if (previous === undefined) queryClient.removeQueries({ queryKey, exact: true });
        else queryClient.setQueryData(queryKey, () => previous);
      }
    },
    onSettled: async () => {
      if (!invalidateOnSettle) return;
      await Promise.all(
        targets.map((target) => queryClient.invalidateQueries({ queryKey: resolveKey(target.key) })),
      );
    },
  });

  const error: ApiError | null = mutation.error ? toApiError(mutation.error) : null;

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    data: mutation.data,
    loading: mutation.isPending,
    error,
    reset: mutation.reset,
  };
}
