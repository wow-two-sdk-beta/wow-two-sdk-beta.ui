import { lazy, Suspense, type ReactElement } from 'react';

// Lazy dynamic import so the devtools land in their own chunk and are never fetched in prod —
// `import.meta.env.DEV` is statically false there, so the render branch (and its import) is dead
// code the bundler tree-shakes away.
const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
);

/** Renders the React Query devtools in dev only; returns null in production. */
export function QueryDevtools(): ReactElement | null {
  if (!import.meta.env.DEV) return null;

  return (
    <Suspense fallback={null}>
      <ReactQueryDevtools initialIsOpen={false} />
    </Suspense>
  );
}
