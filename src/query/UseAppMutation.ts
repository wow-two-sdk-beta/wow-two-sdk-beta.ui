import { useMutation, useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';

import type { ApiError } from '../foundation/http';

import { toApiError } from './ToApiError';

/** Defines options for `useAppMutation`. */
export interface UseAppMutationOptions<TData, TVars> {
  /** Performs the mutation against the backend. */
  readonly mutationFn: (vars: TVars) => Promise<TData>;

  /** Query keys to invalidate on success — derived from the vars and the server's returned value. */
  readonly invalidates?: (vars: TVars, data: TData) => readonly QueryKey[];

  /** Reconciles the cache from the server's confirmed result (e.g. `setQueryData`) after invalidation. */
  readonly onConfirmed?: (data: TData, vars: TVars, queryClient: QueryClient) => void;
}

/** Manages a passive mutation — reconciles the cache only from the backend-confirmed result; no optimistic update, no rollback. */
export function useAppMutation<TData, TVars>({
  mutationFn,
  invalidates,
  onConfirmed,
}: UseAppMutationOptions<TData, TVars>) {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVars>({
    mutationFn,
    onSuccess: async (data, vars) => {
      const keys = invalidates?.(vars, data) ?? [];
      await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onConfirmed?.(data, vars, queryClient);
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
