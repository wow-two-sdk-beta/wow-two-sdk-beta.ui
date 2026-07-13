import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SectionHeader,
  Stat,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from '@wow-two-beta/ui/presentation/display';
import { ProgressBar } from '@wow-two-beta/ui/presentation/feedback';
import manifestJson from '../manifest.gen.json';
import { ROUTES } from '../routes';

/* ------------------------------------------------------------------ */
/* Manifest shape + derived coverage data (pure, deterministic)        */
/* ------------------------------------------------------------------ */

interface Manifest {
  /** domain → every named export of its barrel. */
  domains: Record<string, string[]>;
  /** route module key → `"{domain}/{Export}"` imports it uses. */
  routes: Record<string, string[]>;
}

const manifest = manifestJson as unknown as Manifest;

/** Union of everything used anywhere — keys are `"{domain}/{Export}"`. */
const usedKeys = new Set<string>();
for (const imports of Object.values(manifest.routes)) {
  for (const key of imports) usedKeys.add(key);
}

interface DomainCoverage {
  domain: string;
  total: number;
  used: number;
  pct: number;
  unused: string[];
}

const domainCoverage: DomainCoverage[] = Object.entries(manifest.domains).map(
  ([domain, exportNames]) => {
    const unused = exportNames.filter((name) => !usedKeys.has(`${domain}/${name}`));
    const total = exportNames.length;
    const used = total - unused.length;
    return {
      domain,
      total,
      used,
      pct: total === 0 ? 0 : Math.round((used / total) * 100),
      unused,
    };
  },
);

const totalExports = domainCoverage.reduce((sum, d) => sum + d.total, 0);
const totalUsed = domainCoverage.reduce((sum, d) => sum + d.used, 0);
const overallPct = totalExports === 0 ? 0 : Math.round((totalUsed / totalExports) * 100);
const routeModuleCount = Object.keys(manifest.routes).length;

interface RouteRow {
  path: string;
  title: string;
  group: string;
  module: string;
  imports: string[];
}

const routeRows: RouteRow[] = ROUTES.map((route) => ({
  path: route.path,
  title: route.title,
  group: route.group,
  module: route.module,
  imports: manifest.routes[route.module] ?? [],
}));

function coverageTone(pct: number): 'success' | 'brand' | 'warning' | 'danger' {
  if (pct >= 70) return 'success';
  if (pct >= 40) return 'brand';
  if (pct >= 15) return 'warning';
  return 'danger';
}

/** Max chips rendered inline per route row before collapsing into “+N more”. */
const MAX_ROUTE_CHIPS = 14;

function ChevronGlyph() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className="transition-transform duration-200 group-data-[state=open]:rotate-180"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

function OverviewSection() {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title="Coverage"
        description="How much of the @wow-two-beta/ui export surface this showcase actually exercises."
        size="xl"
        actions={<Tag variant="info">auto-generated</Tag>}
      />
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <Stat label="Overall coverage" value={`${overallPct}%`} helper="union across all routes" size="sm" />
        <Stat label="Exports used" value={`${totalUsed} / ${totalExports}`} helper="named exports touched" size="sm" />
        <Stat label="Domains" value={domainCoverage.length} helper="subpath entry points" size="sm" />
        <Stat label="Route modules" value={routeModuleCount} helper="pages importing the lib" size="sm" />
      </div>
      <div className="flex flex-col gap-1.5">
        <ProgressBar
          value={overallPct}
          tone={coverageTone(overallPct)}
          size="lg"
          label="Overall export coverage"
        />
        <p className="text-xs text-muted-foreground">
          Caveat: the manifest counts <span className="font-medium text-foreground">every named export</span> in
          the domain barrels — subcomponents (<code>TableRow</code>, <code>CarouselDot</code>…) and variant
          constants (<code>buttonVariants</code>…) included — so raw numbers undercount real component coverage.
        </p>
      </div>
    </section>
  );
}

function DomainCard({ coverage }: { coverage: DomainCoverage }) {
  const { domain, total, used, pct, unused } = coverage;
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-mono text-sm font-semibold text-foreground">{domain}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {used}/{total} · {pct}%
        </span>
      </div>
      <ProgressBar value={pct} tone={coverageTone(pct)} label={`${domain} coverage`} />
      {unused.length === 0 ? (
        <Tag variant="success" className="self-start">all exports used</Tag>
      ) : (
        <Collapsible>
          <CollapsibleTrigger className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
            {unused.length} unused export{unused.length === 1 ? '' : 's'}
            <ChevronGlyph />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {unused.map((name) => (
                <Tag key={name} variant="neutral">{name}</Tag>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

function DomainsSection() {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title="By domain"
        description="Per-barrel coverage — expand a card to see which exports no page imports yet."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {domainCoverage.map((coverage) => (
          <DomainCard key={coverage.domain} coverage={coverage} />
        ))}
      </div>
    </section>
  );
}

function RouteChips({ imports }: { imports: string[] }) {
  if (imports.length === 0) {
    return <span className="text-xs text-muted-foreground">— not in manifest yet</span>;
  }
  const visible = imports.slice(0, MAX_ROUTE_CHIPS);
  const hidden = imports.length - visible.length;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((key) => {
        const name = key.split('/')[1] ?? key;
        return (
          <Tag key={key} variant="brand" title={key}>{name}</Tag>
        );
      })}
      {hidden > 0 && <Tag variant="neutral">+{hidden} more</Tag>}
    </div>
  );
}

function RoutesSection() {
  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title="By route"
        description="What each page module imports from the library (hover a chip for its domain)."
      />
      <Table density="cozy" isHoverable>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Route</TableHeaderCell>
            <TableHeaderCell>Group</TableHeaderCell>
            <TableHeaderCell className="text-right">Imports</TableHeaderCell>
            <TableHeaderCell className="w-1/2">Components</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {routeRows.map((row) => (
            <TableRow key={row.path}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{row.title}</span>
                  <span className="font-mono text-xs text-muted-foreground">{row.path}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{row.group}</TableCell>
              <TableCell className="text-right tabular-nums">{row.imports.length}</TableCell>
              <TableCell>
                <RouteChips imports={row.imports} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CoveragePage() {
  return (
    <div className="flex flex-col gap-12">
      <OverviewSection />
      <DomainsSection />
      <RoutesSection />
    </div>
  );
}
