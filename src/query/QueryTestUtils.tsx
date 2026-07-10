import type { ReactElement, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';

const GcTimeMs = Infinity;

/** Creates a `QueryClient` tuned for tests — retries off, no gc eviction, no focus-refetch. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: GcTimeMs, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

/** Defines options for `renderWithQuery`. */
export interface RenderWithQueryOptions {
  /** The client to provide; a fresh test client when omitted. */
  readonly client?: QueryClient;
}

/** Represents the RTL render result augmented with the `QueryClient` it was rendered against. */
export type RenderWithQueryResult = RenderResult & { readonly client: QueryClient };

/** Renders `ui` inside a `QueryClientProvider` for tests — returns the RTL result plus the client used. */
export function renderWithQuery(
  ui: ReactElement,
  options: RenderWithQueryOptions = {},
): RenderWithQueryResult {
  const client = options.client ?? createTestQueryClient();
  const result = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { ...result, client };
}

/** Builds a `renderHook` wrapper that provides a `QueryClient` — pass as `renderHook(fn, { wrapper })`. */
export function createQueryWrapper(client: QueryClient = createTestQueryClient()) {
  return function QueryWrapper({ children }: { readonly children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
