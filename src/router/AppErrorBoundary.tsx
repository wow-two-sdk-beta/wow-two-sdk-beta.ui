import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

/** Renders the app-level route error boundary — surfaces a thrown route/loader error with a way back. */
export function AppErrorBoundary() {
  const error = useRouteError();
  const status = isRouteErrorResponse(error) ? error.status : undefined;
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'Something went wrong.'
    : error instanceof Error
      ? error.message
      : 'Something went wrong.';

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      {status !== undefined && <p className="font-mono text-sm text-muted-foreground">{status}</p>}
      <h1 className="text-lg font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Link to="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Back to start
      </Link>
    </div>
  );
}
