import { Link } from 'react-router-dom';

/** Renders the `*` catch-all page — any unknown path resolves here. */
export function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold text-foreground">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">That page doesn&apos;t exist or has moved.</p>
      <Link to="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Back to start
      </Link>
    </div>
  );
}
