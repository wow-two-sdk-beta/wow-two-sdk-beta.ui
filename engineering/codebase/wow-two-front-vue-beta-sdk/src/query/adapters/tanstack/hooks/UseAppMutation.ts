import { queryOutcome } from '../QueryOutcome';
import { resolveQueryResult } from '../QueryOutcome';
import type { Result } from '../../../../foundation/results';
import { computed, type ComputedRef, type Ref } from 'vue';
import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/vue-query';

import type { ApiFailure } from '../../../../foundation/http';

import type { AppQueryMeta } from '../CreateQueryClient';
import { toApiFailure } from '../QueryOutcome';

/** Defines options for `useAppMutation`. */
export interface UseAppMutationOptions<TData, TVars> {
  /** Performs the mutation against the backend. */
  readonly mutationFn: (vars: TVars) => Promise<Result<TData, ApiFailure>>;

  /** Query keys to invalidate on success — derived from the vars and the server's returned value. */
  readonly invalidates?: (vars: TVars, data: TData) => ReadonlyArray<QueryKey>;

  /** Reconciles the cache from the server's confirmed result (e.g. `setQueryData`) after invalidation. */
  readonly onConfirmed?: (data: TData, vars: TVars, queryClient: QueryClient) => void;

  /** Metadata for the global `onError` seam — `suppressGlobalError: true` keeps this mutation's failures out. */
  readonly meta?: AppQueryMeta;
}

/** Represents a mutation's slice — state as refs, commands as plain functions. */
export interface UseAppMutationReturn<TData, TVars> {
  /** Fires the mutation, fire-and-forget. */
  readonly mutate: (vars: TVars) => void;

  /** Fires the mutation and resolves with its result. */
  readonly mutateAsync: (vars: TVars) => Promise<Result<TData, ApiFailure>>;

  /** The last successful result. */
  readonly data: Ref<TData | undefined>;

  /** True while the mutation is in flight. */
  readonly loading: Ref<boolean>;

  /** The failure coerced to `ApiFailure`, or `null`. */
  readonly error: ComputedRef<ApiFailure | null>;

  /** Clears the mutation back to idle. */
  readonly reset: () => void;
}

/**
 * Manages a passive mutation — reconciles the cache only from the backend-confirmed result; no
 * optimistic update, no rollback.
 */
export function useAppMutation<TData, TVars>({
  mutationFn,
  invalidates,
  onConfirmed,
  meta,
}: UseAppMutationOptions<TData, TVars>): UseAppMutationReturn<TData, TVars> {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVars>({
    mutationFn: (vars) => resolveQueryResult(mutationFn(vars)),
    meta,
    onSuccess: async (data, vars) => {
      const keys = invalidates?.(vars, data) ?? [];
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onConfirmed?.(data, vars, queryClient);
    },
  });

  return {
    mutate: mutation.mutate,
    mutateAsync: (vars) => queryOutcome(() => mutation.mutateAsync(vars)),
    data: mutation.data,
    loading: mutation.isPending,
    error: computed(() => (mutation.error.value ? toApiFailure(mutation.error.value) : null)),
    reset: mutation.reset,
  };
}
