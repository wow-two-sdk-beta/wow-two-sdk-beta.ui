// @wow-two-beta/ui/query — data layer over TanStack Query v5. A thin, opinionated wrapper: house
// QueryClient defaults + a configurable retry policy (from `foundation/resilience`), raw→domain
// query / mutation / batch / paginated / lazy / infinite / suspense hooks that coerce failures to the
// SDK `ApiError`, an imperative cache accessor, intent-based prefetch, opt-in localStorage persistence,
// a dev-only devtools mount, and a `QueryProgressBridge` that drives the router's manual heartbeat
// while requests are in flight. Passive mutations only (no optimistic).
//
// `@tanstack/react-query` is an OPTIONAL peer — this subpath carries it so every other entry stays
// RQ-free (mirrors how `/router` isolates react-router-dom). Apps declare their own typed `queryKeys`
// registry (the data-layer parallel to the router's `paths`) — it stays app-local and is NOT exported
// here. Test helpers live at `@wow-two-beta/ui/query/testing` (kept out of this runtime barrel).

// Foundation
export { createQueryClient, type CreateQueryClientOptions } from './CreateQueryClient';
export { QueryProvider } from './QueryProvider';
export { toApiError } from './ToApiError';

// Core hooks
export { useAppQuery, type UseAppQueryOptions } from './UseAppQuery';
export { useAppInfiniteQuery, type UseAppInfiniteQueryOptions } from './UseAppInfiniteQuery';
export { useAppMutation, type UseAppMutationOptions } from './UseAppMutation';
export { useAppQueries, type UseAppQueriesOptions, type AppQueriesEntry, type AppQueryResult } from './UseAppQueries';
export { useAppPaginatedQuery, type UseAppPaginatedQueryOptions } from './UseAppPaginatedQuery';
export { useAppLazyQuery, type UseAppLazyQueryOptions } from './UseAppLazyQuery';
export { useQueryCache, type QueryCacheApi, type QueryCachePrefetch } from './UseQueryCache';

// Prefetch + suspense
export { usePrefetchQuery, prefetchProps, type PrefetchTarget, type PrefetchProps } from './UsePrefetchQuery';
export { useAppSuspenseQuery, type AppSuspenseQueryOptions } from './UseAppSuspenseQuery';

// Integrations
export { QueryProgressBridge } from './QueryProgressBridge';
export { QueryDevtools } from './Devtools';
export { setupQueryPersistence, type SetupQueryPersistenceOptions, type QueryPersistenceHandle } from './Persistence';
