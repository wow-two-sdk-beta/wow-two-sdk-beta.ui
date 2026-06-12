import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@wow-two-beta/ui/display';
import type { RouteEntry } from '../routes';
import manifest from '../manifest.gen.json';

interface Manifest {
  domains: Record<string, string[]>;
  routes: Record<string, string[]>;
}

const typedManifest = manifest as Manifest;

/* Short lists render inline; longer ones collapse behind a Collapsible. */
const INLINE_LIMIT = 6;

function Chips({ used }: { used: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {used.map((c) => (
        <code
          key={c}
          className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
        >
          {c}
        </code>
      ))}
    </div>
  );
}

/** Page header: title + "components used" chips from the generated manifest. */
export function RouteHeader({ entry }: { entry: RouteEntry }) {
  const used = typedManifest.routes[entry.module] ?? [];

  if (used.length > INLINE_LIMIT) {
    return (
      <header className="border-b border-border px-6 py-4">
        {/* key resets the open state on route change */}
        <Collapsible key={entry.path} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-semibold">{entry.title}</h1>
            <CollapsibleTrigger className="group inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-subtle-foreground transition-colors hover:bg-muted hover:text-foreground">
              {used.length} components
              <span aria-hidden className="transition-transform group-data-[state=open]:rotate-90">
                ▸
              </span>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <Chips used={used} />
          </CollapsibleContent>
        </Collapsible>
      </header>
    );
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-4">
      <h1 className="text-lg font-semibold">{entry.title}</h1>
      {used.length > 0 && (
        <>
          <span className="text-xs text-subtle-foreground">{used.length} components:</span>
          <Chips used={used} />
        </>
      )}
    </header>
  );
}
