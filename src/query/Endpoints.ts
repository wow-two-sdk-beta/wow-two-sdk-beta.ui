// Typed endpoint definitions — the generic core of a query-factory registry (the data-layer
// `definePath`). An app declares per-resource factories over `defineEndpoint`
// (`const codesApi = { list: (q?: string) => defineEndpoint({ key: …, queryFn: … }) }`); this module
// owns only the typing core — key + fetcher declared once, together, so the pairing can never desync.
// A def is a plain `{ key, queryFn }`: it spreads into `useAppQuery` / `useAppSuspenseQuery` /
// `useAppLazyQuery`, feeds `usePrefetchQuery` / `prefetchProps` / `useQueryCache().prefetch` whole,
// and pairs with a bare `QueryClient` (`fetchQuery({ queryKey: def.key, queryFn: def.queryFn })`).
// Mutations stay plain client calls into `useAppMutation` — no def shape for writes.
// See docs/analysis/http-query-integration.md.

import type { QueryKey } from '@tanstack/react-query';

/** Defines a typed endpoint — a query key fused with the fetcher that fills it. */
export interface Endpoint<TRaw> {
  /** The query key this endpoint caches under — the same key every consuming surface reads. */
  readonly key: QueryKey;

  /** Fetches the raw payload; receives the RQ `AbortSignal` so the request cancels with the query. */
  readonly queryFn: (context: { signal: AbortSignal }) => Promise<TRaw>;
}

/** Defines a parameterized endpoint factory — call with the endpoint's args for a def keyed to them. */
export type EndpointFn<TArgs extends readonly unknown[], TRaw> = (...args: TArgs) => Endpoint<TRaw>;

/** Creates a typed endpoint definition — constrains the shape, infers `TRaw` from the fetcher, and returns the def unchanged (pure typing; deleting the call leaves valid code). */
export function defineEndpoint<TRaw>(endpoint: Endpoint<TRaw>): Endpoint<TRaw> {
  return endpoint;
}
