import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Toolbar, ToolbarButton, ToolbarSeparator } from '@wow-two-beta/ui/actions';
import {
  ActivityFeed,
  ActivityItem,
  AnimatedNumber,
  Avatar,
  Badge,
  CountUp,
  DataGrid,
  DataTable,
  HeatmapCalendar,
  MetricChip,
  Sparkline,
  Stat,
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTitle,
  type DataGridColumn,
  type DataTableColumn,
  type DataTableSort,
  type TimelineStatus,
} from '@wow-two-beta/ui/display';
import {
  Banner,
  LoadingState,
  Skeleton,
  TrendIndicator,
  useToaster,
} from '@wow-two-beta/ui/feedback';
import { Pagination } from '@wow-two-beta/ui/nav';
import {
  activityItems,
  deployFrequency,
  events,
  heatmapDays,
  kpis,
  projectTasks,
  sparklines,
  users,
  usersById,
  type EventKind,
  type Kpi,
  type TaskPriority,
  type TaskStatus,
} from '../../fixtures';

/* ------------------------------- helpers ---------------------------------- */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso: string): string {
  const m = Number(iso.slice(5, 7));
  return `${MONTHS[m - 1] ?? '—'} ${iso.slice(8, 10)}`;
}

function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} · ${iso.slice(11, 16)}`;
}

function userName(id: string): string {
  return usersById[id]?.name ?? 'Unknown';
}

const FALLBACK_KPI: Kpi = {
  id: 'kpi-missing',
  label: '—',
  value: '—',
  rawValue: 0,
  delta: 0,
  deltaDirection: 'flat',
  comparedTo: '—',
};

function kpi(id: string): Kpi {
  return kpis.find((k) => k.id === id) ?? FALLBACK_KPI;
}

function spark(id: string): number[] {
  return sparklines.find((s) => s.id === id)?.points ?? [];
}

function latest(points: number[]): number {
  return points.length > 0 ? (points[points.length - 1] ?? 0) : 0;
}

/* ------------------------- deterministic page data ------------------------- */

type DeployStatus = 'success' | 'failed' | 'rolled-back' | 'in-progress';
type DeployEnv = 'prod' | 'staging';

interface Deployment {
  id: string;
  service: string;
  env: DeployEnv;
  version: string;
  actorId: string;
  status: DeployStatus;
  durationSec: number;
  at: string;
}

const deployments: Deployment[] = [
  { id: 'dep-3041', service: 'drydock-api', env: 'prod', version: 'v2.8.1', actorId: 'usr-004', status: 'in-progress', durationSec: 64, at: '2026-06-12T09:40:00Z' },
  { id: 'dep-3040', service: 'edge-gateway', env: 'staging', version: 'v0.14.2', actorId: 'usr-010', status: 'success', durationSec: 92, at: '2026-06-12T08:05:00Z' },
  { id: 'dep-3039', service: 'smart-qr', env: 'prod', version: 'v1.4.0', actorId: 'usr-004', status: 'success', durationSec: 143, at: '2026-06-11T13:25:00Z' },
  { id: 'dep-3038', service: 'billing-worker', env: 'prod', version: 'v3.2.7', actorId: 'usr-009', status: 'failed', durationSec: 38, at: '2026-06-11T10:50:00Z' },
  { id: 'dep-3037', service: 'drydock-web', env: 'staging', version: 'v2.9.0-rc.1', actorId: 'usr-005', status: 'success', durationSec: 210, at: '2026-06-10T16:12:00Z' },
  { id: 'dep-3036', service: 'secrets-vault', env: 'prod', version: 'v0.8.3', actorId: 'usr-003', status: 'success', durationSec: 117, at: '2026-06-10T11:30:00Z' },
  { id: 'dep-3035', service: 'drydock-api', env: 'prod', version: 'v2.8.0', actorId: 'usr-010', status: 'rolled-back', durationSec: 301, at: '2026-06-09T14:45:00Z' },
  { id: 'dep-3034', service: 'edge-gateway', env: 'prod', version: 'v0.14.1', actorId: 'usr-002', status: 'success', durationSec: 88, at: '2026-06-09T09:20:00Z' },
  { id: 'dep-3033', service: 'drydock-web', env: 'prod', version: 'v2.8.4', actorId: 'usr-005', status: 'success', durationSec: 195, at: '2026-06-08T15:02:00Z' },
  { id: 'dep-3032', service: 'billing-worker', env: 'staging', version: 'v3.2.7-rc.2', actorId: 'usr-009', status: 'success', durationSec: 51, at: '2026-06-08T10:18:00Z' },
  { id: 'dep-3031', service: 'smart-qr', env: 'staging', version: 'v1.4.0-rc.3', actorId: 'usr-006', status: 'failed', durationSec: 44, at: '2026-06-05T17:33:00Z' },
  { id: 'dep-3030', service: 'drydock-api', env: 'staging', version: 'v2.8.0-rc.4', actorId: 'usr-004', status: 'success', durationSec: 132, at: '2026-06-05T12:07:00Z' },
  { id: 'dep-3029', service: 'secrets-vault', env: 'staging', version: 'v0.8.3-rc.1', actorId: 'usr-003', status: 'success', durationSec: 109, at: '2026-06-04T09:55:00Z' },
  { id: 'dep-3028', service: 'edge-gateway', env: 'prod', version: 'v0.14.0', actorId: 'usr-010', status: 'success', durationSec: 97, at: '2026-06-03T13:41:00Z' },
  { id: 'dep-3027', service: 'drydock-web', env: 'prod', version: 'v2.8.3', actorId: 'usr-001', status: 'success', durationSec: 178, at: '2026-06-02T11:26:00Z' },
  { id: 'dep-3026', service: 'drydock-api', env: 'prod', version: 'v2.7.9', actorId: 'usr-002', status: 'success', durationSec: 121, at: '2026-06-01T08:14:00Z' },
];

const DEPLOY_BADGE: Record<DeployStatus, 'success' | 'danger' | 'warning' | 'info'> = {
  success: 'success',
  failed: 'danger',
  'rolled-back': 'warning',
  'in-progress': 'info',
};

const PAGE_SIZE = 6;

function compareDeployments(a: Deployment, b: Deployment, key: string): number {
  switch (key) {
    case 'durationSec':
      return a.durationSec - b.durationSec;
    case 'service':
      return a.service.localeCompare(b.service);
    case 'status':
      return a.status.localeCompare(b.status);
    case 'at':
      return a.at.localeCompare(b.at);
    case 'id':
      return a.id.localeCompare(b.id);
    default:
      return 0;
  }
}

const deployColumns: DataTableColumn<Deployment>[] = [
  {
    key: 'id',
    header: 'Deploy',
    sortable: true,
    accessor: (r) => r.id,
    cell: (r) => <span className="font-mono text-xs">{r.id}</span>,
  },
  {
    key: 'service',
    header: 'Service',
    sortable: true,
    accessor: (r) => r.service,
    cell: (r) => (
      <span className="inline-flex items-center gap-2">
        <span className="font-medium">{r.service}</span>
        <Badge size="sm" variant={r.env === 'prod' ? 'brand' : 'outline'}>
          {r.env}
        </Badge>
      </span>
    ),
  },
  {
    key: 'version',
    header: 'Version',
    cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.version}</span>,
  },
  {
    key: 'actor',
    header: 'Triggered by',
    cell: (r) => (
      <span className="inline-flex items-center gap-2">
        <Avatar size="xs" name={userName(r.actorId)} autoColor />
        <span className="text-sm">{userName(r.actorId)}</span>
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge size="sm" variant={DEPLOY_BADGE[r.status]}>
        {r.status}
      </Badge>
    ),
  },
  {
    key: 'durationSec',
    header: 'Duration',
    sortable: true,
    align: 'right',
    accessor: (r) => r.durationSec,
    cell: (r) => <span className="tabular-nums">{r.durationSec}s</span>,
  },
  {
    key: 'at',
    header: 'When',
    sortable: true,
    accessor: (r) => r.at,
    cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{fmtDateTime(r.at)}</span>,
  },
];

/* DataGrid rows — editable copy of the sprint tasks fixture. */
interface GridRow {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
}

const initialGridRows: GridRow[] = projectTasks.slice(0, 6).map((t) => ({
  id: t.id,
  title: t.title,
  status: t.status,
  priority: t.priority,
  assigneeId: t.assigneeId,
}));

const gridColumns: DataGridColumn<GridRow>[] = [
  { key: 'id', header: 'ID', accessor: (r) => r.id, editable: false, width: '6rem' },
  { key: 'title', header: 'Title', accessor: (r) => r.title, type: 'text' },
  {
    key: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    type: 'select',
    options: [
      { value: 'backlog', label: 'Backlog' },
      { value: 'todo', label: 'Todo' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'in-review', label: 'In review' },
      { value: 'done', label: 'Done' },
    ],
  },
  {
    key: 'priority',
    header: 'Priority',
    accessor: (r) => r.priority,
    type: 'select',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ],
  },
  {
    key: 'assigneeId',
    header: 'Assignee',
    accessor: (r) => r.assigneeId,
    cell: (r) => <span>{userName(r.assigneeId)}</span>,
    type: 'select',
    options: users.map((u) => ({ value: u.id, label: u.name })),
  },
];

/* Heatmap + weekly deploy series (all static fixture-derived). */
const heatmapValues: Record<string, number> = Object.fromEntries(
  heatmapDays.map((d) => [d.date, d.count]),
);
const deployFreqPoints = deployFrequency.map((d) => d.count);
const peakWeek = deployFreqPoints.length > 0 ? Math.max(...deployFreqPoints) : 0;

/* Timeline — releases / deploys / maintenance windows from the events fixture. */
const TIMELINE_KINDS: EventKind[] = ['deploy', 'release', 'maintenance'];
const TIMELINE_STATUS: Partial<Record<EventKind, TimelineStatus>> = {
  deploy: 'primary',
  release: 'success',
  maintenance: 'warning',
};
const timelineEvents = events.filter((e) => TIMELINE_KINDS.includes(e.kind)).slice(0, 6);

const feedItems = activityItems.slice(0, 7);

/* -------------------------------- chrome ----------------------------------- */

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-28" />
            <Skeleton className="mt-4 h-7 w-full" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-28 w-full" />
      </div>
      <LoadingState
        title="Loading dashboard…"
        description="Crunching deploy metrics and activity."
      />
    </div>
  );
}

/* --------------------------------- screen ---------------------------------- */

export default function DashboardScreen() {
  const { toast } = useToaster();

  /* Simulated fetch: 800ms skeleton on mount and on every Refresh. */
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 800);
    return () => window.clearTimeout(t);
  }, [reloadKey]);

  const [bannerOpen, setBannerOpen] = useState(true);
  const [deployCount, setDeployCount] = useState(kpi('kpi-active-deploys').rawValue);
  const [sort, setSort] = useState<DataTableSort | null>({ columnKey: 'at', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [gridRows, setGridRows] = useState<GridRow[]>(initialGridRows);

  const sortedDeployments = useMemo(() => {
    if (!sort) return deployments;
    const copy = [...deployments].sort((a, b) => compareDeployments(a, b, sort.columnKey));
    return sort.direction === 'desc' ? copy.reverse() : copy;
  }, [sort]);

  const pageCount = Math.max(1, Math.ceil(sortedDeployments.length / PAGE_SIZE));
  const pageRows = sortedDeployments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageFrom = (page - 1) * PAGE_SIZE + 1;
  const pageTo = Math.min(page * PAGE_SIZE, sortedDeployments.length);

  const mrr = kpi('kpi-mrr');
  const errorRate = kpi('kpi-error-rate');
  const uptime = kpi('kpi-uptime');
  const tickets = kpi('kpi-open-tickets');
  const signups = kpi('kpi-signups');

  const handleGridChange = (row: GridRow, colKey: string, value: unknown) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === row.id ? ({ ...r, [colKey]: value } as GridRow) : r)),
    );
    toast({
      severity: 'success',
      title: 'Task updated',
      description: `${row.id} · ${colKey} → ${String(value)}`,
    });
  };

  return (
    <div className="space-y-6">
      {bannerOpen && (
        <Banner
          severity="warning"
          title="Scheduled maintenance"
          description="DB maintenance on srv-us-1 — Jun 18, 02:00–04:00 UTC. Deploys to prod are frozen during the window."
          onClose={() => setBannerOpen(false)}
          actions={
            <Button
              size="sm"
              variant="outline"
              tone="neutral"
              className="border-current text-current hover:bg-foreground/10"
              onClick={() => toast({ severity: 'info', title: 'Maintenance window', description: 'Added to your calendar (demo).' })}
            >
              View schedule
            </Button>
          }
        />
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Drydock Ops</h1>
          <p className="text-sm text-muted-foreground">
            Deploys, revenue and on-call health — June 12, 2026.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Toolbar aria-label="Dashboard actions">
            <ToolbarButton disabled={loading} onClick={() => setReloadKey((k) => k + 1)}>
              Refresh
            </ToolbarButton>
            <ToolbarButton
              onClick={() => toast({ severity: 'success', title: 'Export started', description: 'deployments.csv will be ready shortly (demo).' })}
            >
              Export CSV
            </ToolbarButton>
            <ToolbarSeparator />
            <ToolbarButton
              onClick={() => toast({ severity: 'info', title: 'Share link copied', description: '/app/dashboard?range=jun-2026' })}
            >
              Share
            </ToolbarButton>
          </Toolbar>
          <Button
            size="sm"
            tone="primary"
            onClick={() => toast({ severity: 'info', title: 'New deploy', description: 'Pick a service and ref in the deploy drawer (demo).' })}
          >
            New deploy
          </Button>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <Stat
                size="sm"
                label={mrr.label}
                value={
                  <CountUp
                    to={mrr.rawValue}
                    duration={1200}
                    format={(v) => `$${(v / 1000).toFixed(1)}k`}
                  />
                }
              />
              <div className="mt-2 flex items-end justify-between gap-2">
                <TrendIndicator size="xs" value={mrr.delta} label={`vs ${mrr.comparedTo}`} />
                <Sparkline
                  data={spark('spark-mrr')}
                  variant="area"
                  width={110}
                  height={30}
                  tone="brand"
                  ariaLabel="MRR trend"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <Stat
                size="sm"
                label="Active deployments"
                value={<AnimatedNumber value={deployCount} duration={400} />}
              />
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="inline-flex items-center gap-1">
                  <Button
                    size="xs"
                    variant="ghost"
                    tone="neutral"
                    aria-label="Simulate deploy finished"
                    onClick={() => setDeployCount((c) => Math.max(0, c - 1))}
                  >
                    −
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    tone="neutral"
                    aria-label="Simulate new deploy"
                    onClick={() => setDeployCount((c) => c + 1)}
                  >
                    +
                  </Button>
                </span>
                <Sparkline
                  data={deployFreqPoints}
                  variant="bar"
                  width={110}
                  height={30}
                  tone="muted"
                  ariaLabel="Deploys per week"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <Stat size="sm" label={errorRate.label} value={errorRate.value} />
              <div className="mt-2 flex items-end justify-between gap-2">
                <TrendIndicator
                  size="xs"
                  value={errorRate.delta}
                  inverse
                  label={`vs ${errorRate.comparedTo}`}
                />
                <Sparkline
                  data={spark('spark-errors')}
                  variant="line"
                  width={110}
                  height={30}
                  tone="danger"
                  showLast
                  ariaLabel="Errors per day"
                />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <Stat
                size="sm"
                label={signups.label}
                value={<CountUp to={signups.rawValue} duration={1200} />}
              />
              <div className="mt-2 flex items-end justify-between gap-2">
                <TrendIndicator size="xs" value={signups.delta} label={`vs ${signups.comparedTo}`} />
              </div>
            </div>
          </div>

          {/* MetricChip strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-card px-4 py-3">
            <MetricChip label="Uptime" value={uptime.value} tone="success" />
            <MetricChip label="Open tickets" value={tickets.value} tone="warning" />
            <MetricChip
              label="p95 latency"
              value={`${latest(spark('spark-latency'))}ms`}
              tone="info"
            />
            <MetricChip label="API req" value={`${latest(spark('spark-requests'))}k/day`} />
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
              requests
              <Sparkline
                data={spark('spark-requests')}
                variant="line"
                width={140}
                height={24}
                tone="muted"
                showLast
                ariaLabel="API requests trend"
              />
            </span>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            {/* Main column */}
            <div className="min-w-0 space-y-6">
              <Panel
                title="Deploy activity — 2026"
                action={<MetricChip label="Peak week" value={`${peakWeek} deploys`} tone="success" size="xs" />}
              >
                <div className="overflow-x-auto pb-1">
                  <HeatmapCalendar
                    values={heatmapValues}
                    year={2026}
                    weekStart={1}
                    cellSize={10}
                    tone="brand"
                    onCellClick={(date, value) =>
                      toast({
                        severity: 'info',
                        title: date,
                        description: `${value} deploy${value === 1 ? '' : 's'} that day.`,
                      })
                    }
                  />
                </div>
              </Panel>

              <Panel
                title="Recent deployments"
                action={
                  <span className="text-xs text-muted-foreground">
                    Showing {pageFrom}–{pageTo} of {sortedDeployments.length}
                  </span>
                }
              >
                <div className="overflow-x-auto">
                  <DataTable<Deployment>
                    aria-label="Recent deployments"
                    columns={deployColumns}
                    data={pageRows}
                    rowKey={(r) => r.id}
                    sortBy={sort}
                    onSortChange={(next) => {
                      setSort(next);
                      setPage(1);
                    }}
                    hoverable
                    density="compact"
                    onRowClick={(r) =>
                      toast({
                        severity: 'info',
                        title: r.id,
                        description: `${r.service} ${r.version} → ${r.env} · ${r.status}`,
                      })
                    }
                  />
                </div>
                <div className="mt-3 flex justify-end">
                  <Pagination total={pageCount} page={page} onPageChange={setPage} hideFirstLast />
                </div>
              </Panel>

              <Panel
                title="Sprint tasks — inline edit"
                action={
                  <span className="text-xs text-muted-foreground">
                    Click a cell · Enter to edit · Esc reverts
                  </span>
                }
              >
                <DataGrid<GridRow>
                  dense
                  columns={gridColumns}
                  rows={gridRows}
                  rowKey={(r) => r.id}
                  onRowChange={handleGridChange}
                />
              </Panel>
            </div>

            {/* Side column */}
            <div className="min-w-0 space-y-6">
              <Panel title="Activity">
                <ActivityFeed dense>
                  {feedItems.map((item, idx) => (
                    <ActivityItem
                      key={item.id}
                      last={idx === feedItems.length - 1}
                      avatar={<Avatar size="sm" name={userName(item.actorId)} autoColor />}
                      timestamp={fmtDateTime(item.at)}
                      actions={
                        !item.read ? (
                          <Badge size="sm" variant="brand">
                            new
                          </Badge>
                        ) : undefined
                      }
                    >
                      <span className="font-medium">{userName(item.actorId)}</span> {item.verb}{' '}
                      <span className="font-medium">{item.target}</span>
                    </ActivityItem>
                  ))}
                </ActivityFeed>
              </Panel>

              <Panel title="Release timeline">
                <Timeline>
                  {timelineEvents.map((evt) => (
                    <TimelineItem key={evt.id} status={TIMELINE_STATUS[evt.kind] ?? 'default'}>
                      <TimelineTitle>{evt.title}</TimelineTitle>
                      <TimelineDescription>
                        {fmtDateTime(evt.start)} · {evt.kind} · {userName(evt.ownerId)}
                      </TimelineDescription>
                    </TimelineItem>
                  ))}
                </Timeline>
              </Panel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
