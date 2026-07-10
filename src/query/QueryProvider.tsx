import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';

/** Defines props for the query provider. */
interface QueryProviderProps {
  /** The app `QueryClient` (from `createQueryClient`). */
  readonly client: QueryClient;

  /** The subtree with access to the client. */
  readonly children: ReactNode;
}

/** Mounts the app `QueryClient` above the tree. */
export function QueryProvider({ client, children }: QueryProviderProps) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
