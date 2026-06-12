import { useRef, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ActivityFeed,
  AnimatedNumber,
  AnnotationMarker,
  AudioPlayer,
  AudioWaveform,
  Avatar,
  AvatarGroup,
  Badge,
  BadgeOverlay,
  Card,
  Carousel,
  CarouselDots,
  CarouselNext,
  CarouselPrev,
  CarouselSlide,
  CarouselSlides,
  CarouselViewport,
  ChatBubble,
  Code,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CommentThread,
  Confetti,
  CountBadge,
  CountUp,
  DataGrid,
  DataTable,
  DescriptionList,
  DiffViewer,
  EmptyState,
  EventCalendar,
  Eyebrow,
  Gantt,
  GradientText,
  Heading,
  HeatmapCalendar,
  Highlight,
  Image,
  InfoRow,
  Kbd,
  KeyboardShortcut,
  List,
  ListItem,
  Mark,
  Marquee,
  MessageList,
  MetaInline,
  MetricChip,
  NodeEditor,
  NotificationDot,
  PDFViewer,
  Quote,
  ReactionBar,
  ScheduleView,
  ScrollReveal,
  SectionHeader,
  Separator,
  Snippet,
  Sparkline,
  Stat,
  Status,
  SwipeActions,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  Tag,
  Text,
  ThreadView,
  Tilt,
  Timeline,
  TimelineDescription,
  TimelineItem,
  TimelineTitle,
  Tooltip,
  Tree,
  TreeGroup,
  TreeItem,
  Typewriter,
  VideoPlayer,
  type ConfettiHandle,
  type DataTableColumn,
  type EventCalendarEvent,
  type NodeEditorEdge,
  type NodeEditorNode,
  type Reaction,
} from '@wow-two-beta/ui/display';

/* ------------------------------------------------------------------ */
/* Deterministic fixtures                                             */
/* ------------------------------------------------------------------ */

const SPARK_DATA = [4, 7, 5, 9, 6, 11, 8, 13, 10, 15, 12, 17];
const SPARK_FLAT = [9, 8, 9, 7, 8, 6, 7, 5, 6, 4, 5, 3];

const WAVE_PEAKS = Array.from({ length: 56 }, (_, i) =>
  0.25 + 0.7 * Math.abs(Math.sin(i * 0.45) * Math.cos(i * 0.12)),
);

function buildHeatmapValues(): Record<string, number> {
  const values: Record<string, number> = {};
  for (let month = 0; month < 12; month += 1) {
    for (let day = 1; day <= 28; day += 3) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      values[`2026-${mm}-${dd}`] = (month * 5 + day * 3) % 9;
    }
  }
  return values;
}
const HEATMAP_VALUES = buildHeatmapValues();

const IMG_OK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">' +
      '<rect width="320" height="180" fill="#475569"/>' +
      '<circle cx="110" cy="78" r="34" fill="#cbd5e1"/>' +
      '<rect x="170" y="52" width="110" height="12" rx="6" fill="#94a3b8"/>' +
      '<rect x="170" y="78" width="80" height="12" rx="6" fill="#94a3b8"/>' +
      '<rect x="170" y="104" width="95" height="12" rx="6" fill="#64748b"/>' +
      '</svg>',
  );
const IMG_BROKEN = 'data:image/png;base64,broken';

const DIFF_LEFT = `function greet(name) {
  const msg = 'Hello ' + name;
  console.log(msg);
  return msg;
}`;
const DIFF_RIGHT = `function greet(name, locale = 'en') {
  const msg = format(locale, name);
  return msg;
}`;

interface Invoice {
  id: string;
  customer: string;
  total: number;
  status: 'paid' | 'due' | 'overdue';
}

const INVOICES: Invoice[] = [
  { id: 'INV-1042', customer: 'Acme Corp', total: 1280.5, status: 'paid' },
  { id: 'INV-1043', customer: 'Globex', total: 740, status: 'due' },
  { id: 'INV-1044', customer: 'Initech', total: 2110.25, status: 'overdue' },
  { id: 'INV-1045', customer: 'Umbrella', total: 460.75, status: 'paid' },
  { id: 'INV-1046', customer: 'Stark Industries', total: 3320, status: 'due' },
];

const INVOICE_BADGE: Record<Invoice['status'], 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  due: 'warning',
  overdue: 'danger',
};

const INVOICE_COLUMNS: DataTableColumn<Invoice>[] = [
  { key: 'id', header: 'Invoice', accessor: (r) => r.id, sortable: true },
  { key: 'customer', header: 'Customer', accessor: (r) => r.customer, sortable: true },
  {
    key: 'total',
    header: 'Total',
    accessor: (r) => r.total,
    sortable: true,
    align: 'right',
    cell: (r) => `$${r.total.toFixed(2)}`,
  },
  {
    key: 'status',
    header: 'Status',
    accessor: (r) => r.status,
    cell: (r) => (
      <Badge size="sm" variant={INVOICE_BADGE[r.status]}>
        {r.status}
      </Badge>
    ),
  },
];

interface GridRow {
  id: string;
  name: string;
  points: number;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

const GRID_ROWS: GridRow[] = [
  { id: 'g1', name: 'Alice', points: 30, role: 'admin', active: true },
  { id: 'g2', name: 'Bob', points: 24, role: 'editor', active: true },
  { id: 'g3', name: 'Carol', points: 28, role: 'viewer', active: false },
];

const CAL_EVENTS: EventCalendarEvent[] = [
  {
    id: 'standup',
    title: 'Standup',
    start: new Date(2026, 5, 8, 9, 30),
    end: new Date(2026, 5, 8, 9, 45),
  },
  {
    id: 'design',
    title: 'Design review',
    start: new Date(2026, 5, 10, 14, 0),
    end: new Date(2026, 5, 10, 15, 0),
    color: 'var(--color-success)',
  },
  {
    id: 'release',
    title: 'Release 0.4',
    start: new Date(2026, 5, 12, 0, 0),
    end: new Date(2026, 5, 12, 23, 59),
    allDay: true,
    color: 'var(--color-warning)',
  },
  {
    id: 'retro',
    title: 'Retro',
    start: new Date(2026, 5, 12, 16, 0),
    end: new Date(2026, 5, 12, 17, 0),
  },
];

const SCHEDULE_RESOURCES = [
  { id: 'room-a', label: 'Room A' },
  { id: 'room-b', label: 'Room B' },
  { id: 'room-c', label: 'Room C', color: 'var(--color-info)' },
];

const SCHEDULE_BOOKINGS = [
  {
    id: 'b1',
    resourceId: 'room-a',
    start: new Date(2026, 5, 10, 9, 0),
    end: new Date(2026, 5, 10, 10, 30),
    label: 'Sprint planning',
  },
  {
    id: 'b2',
    resourceId: 'room-b',
    start: new Date(2026, 5, 10, 11, 0),
    end: new Date(2026, 5, 10, 12, 0),
    label: '1:1',
    color: 'var(--color-success)',
  },
  {
    id: 'b3',
    resourceId: 'room-c',
    start: new Date(2026, 5, 10, 13, 0),
    end: new Date(2026, 5, 10, 15, 0),
    label: 'Workshop',
  },
];

const GANTT_TASKS = [
  {
    id: 't1',
    label: 'Design tokens',
    start: new Date(2026, 5, 1),
    end: new Date(2026, 5, 6),
    progress: 1,
  },
  {
    id: 't2',
    label: 'Component build',
    start: new Date(2026, 5, 5),
    end: new Date(2026, 5, 16),
    progress: 0.6,
    color: 'var(--color-primary)',
  },
  {
    id: 't3',
    label: 'Showcase app',
    start: new Date(2026, 5, 12),
    end: new Date(2026, 5, 22),
    progress: 0.2,
    color: 'var(--color-success)',
  },
];

const GANTT_DEPS = [
  { from: 't1', to: 't2' },
  { from: 't2', to: 't3' },
];

const GANTT_MILESTONES = [{ id: 'm1', label: 'Beta cut', date: new Date(2026, 5, 18) }];

const NODE_EDITOR_NODES: NodeEditorNode[] = [
  { id: 'input', x: 30, y: 30, label: 'Input' },
  { id: 'transform', x: 250, y: 90, label: 'Transform' },
  { id: 'filter', x: 250, y: 200, label: 'Filter' },
  { id: 'output', x: 480, y: 140, label: 'Output' },
];

const NODE_EDITOR_EDGES: NodeEditorEdge[] = [
  { id: 'e1', source: 'input', target: 'transform', label: 'rows' },
  { id: 'e2', source: 'input', target: 'filter' },
  { id: 'e3', source: 'transform', target: 'output' },
  { id: 'e4', source: 'filter', target: 'output', label: 'matched' },
];

const INITIAL_REACTIONS: Reaction[] = [
  { key: 'up', emoji: '👍', count: 4, reactedByMe: false, users: ['Maya', 'Tom'] },
  { key: 'heart', emoji: '❤️', count: 2, reactedByMe: true, users: ['You', 'Lena'] },
  { key: 'rocket', emoji: '🚀', count: 0, reactedByMe: false },
];

const INITIAL_TAGS = ['react', 'typescript', 'tailwind', 'vite'];

const CAROUSEL_SLIDES = [
  { label: 'Slide 1', tone: 'bg-primary-soft' },
  { label: 'Slide 2', tone: 'bg-success-soft' },
  { label: 'Slide 3', tone: 'bg-warning-soft' },
  { label: 'Slide 4', tone: 'bg-info-soft' },
];

/* ------------------------------------------------------------------ */
/* Local helpers                                                      */
/* ------------------------------------------------------------------ */

function Demo({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-4 ${
        wide ? 'md:col-span-2 xl:col-span-3' : ''
      }`}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function DemoGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      {children}
    </button>
  );
}

function SwipeActionButton({ tone, label }: { tone: string; label: string }) {
  return (
    <button
      type="button"
      className={`flex flex-1 items-center justify-center text-xs font-medium text-primary-foreground ${tone}`}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Gallery                                                            */
/* ------------------------------------------------------------------ */

export default function DisplayGallery() {
  /* Interactive state */
  const [tags, setTags] = useState<string[]>(INITIAL_TAGS);
  const [reactions, setReactions] = useState<Reaction[]>(INITIAL_REACTIONS);
  const [metric, setMetric] = useState(1240);
  const [gridRows, setGridRows] = useState<GridRow[]>(GRID_ROWS);
  const [pickedInvoice, setPickedInvoice] = useState<string | null>(null);
  const [nodes, setNodes] = useState<NodeEditorNode[]>(NODE_EDITOR_NODES);
  const [waveProgress, setWaveProgress] = useState(0.35);
  const [diffView, setDiffView] = useState<'split' | 'unified'>('split');
  const [pickedEvent, setPickedEvent] = useState<string | null>(null);
  const confettiRef = useRef<ConfettiHandle | null>(null);

  const toggleReaction = (key: string) => {
    setReactions((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, reactedByMe: !r.reactedByMe, count: r.count + (r.reactedByMe ? -1 : 1) }
          : r,
      ),
    );
  };

  const addReaction = () => {
    setReactions((prev) =>
      prev.some((r) => r.key === 'party')
        ? prev
        : [...prev, { key: 'party', emoji: '🎉', count: 1, reactedByMe: true }],
    );
  };

  return (
    <div className="flex flex-col gap-10 pb-16">
      {/* ------------------------------------------------ Typography */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Typography & inline"
          description="Headings, body text, and inline affordances."
          actions={<GhostButton>Docs</GhostButton>}
        />
        <DemoGrid>
          <Demo label="Heading">
            <div className="flex flex-col gap-1">
              <Heading level={2} size="2xl">
                Display domain
              </Heading>
              <Heading level={3} size="md" weight="medium">
                Sixty-six components, one page
              </Heading>
            </div>
          </Demo>
          <Demo label="Text">
            <div className="flex flex-col gap-1">
              <Text size="sm">Default body copy at small size.</Text>
              <Text size="sm" color="muted">
                Muted supporting copy.
              </Text>
              <Text size="sm" color="success" weight="semibold">
                Success tone, semibold.
              </Text>
              <Text size="sm" tabular>
                1,024 / 2,048 tabular nums
              </Text>
            </div>
          </Demo>
          <Demo label="Eyebrow">
            <div className="flex flex-col gap-1">
              <Eyebrow>Release notes</Eyebrow>
              <Heading level={3} size="lg">
                What shipped this week
              </Heading>
            </div>
          </Demo>
          <Demo label="GradientText">
            <div className="flex flex-col gap-1">
              <GradientText as="h3" className="text-2xl font-bold">
                Default gradient
              </GradientText>
              <GradientText
                as="span"
                from="var(--color-success)"
                to="var(--color-info)"
                animated
                className="text-xl font-semibold"
              >
                Animated success → info
              </GradientText>
            </div>
          </Demo>
          <Demo label="Quote">
            <Quote>Build first; standardize later. The git log is the changelog.</Quote>
          </Demo>
          <Demo label="Mark / Highlight">
            <div className="flex flex-col gap-2">
              <Text size="sm">
                You mentioned <Mark>fix-forward</Mark> in the last review.
              </Text>
              <Text size="sm" as="div">
                <Highlight query={['beta', 'library']}>
                  The beta UI library ships every component as a library subpath export.
                </Highlight>
              </Text>
            </div>
          </Demo>
          <Demo label="Kbd / KeyboardShortcut">
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">
                <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
              </span>
              <KeyboardShortcut keys={['Ctrl', 'Shift', 'P']} />
              <KeyboardShortcut keys={['G', 'D']} separator=" " />
            </div>
          </Demo>
          <Demo label="Code">
            <div className="flex flex-col gap-2">
              <Text size="sm">
                Install via <Code>pnpm add @wow-two-beta/ui</Code>
              </Text>
              <Code variant="block">{`import { Badge } from '@wow-two-beta/ui/display';

export const Pill = () => <Badge variant="brand">beta</Badge>;`}</Code>
            </div>
          </Demo>
          <Demo label="Snippet">
            <div className="flex flex-col gap-2">
              <Snippet text="pnpm add @wow-two-beta/ui" />
              <Snippet
                variant="block"
                text={'pnpm install\npnpm build\npnpm --filter showcase dev'}
              />
            </div>
          </Demo>
          <Demo label="Typewriter">
            <Typewriter
              className="text-lg font-medium text-foreground"
              text={['Ship the beta.', 'Fix forward.', 'Never gate on review.']}
              loop
            />
          </Demo>
          <Demo label="Separator">
            <div className="flex flex-col gap-2">
              <Text size="sm">Above</Text>
              <Separator />
              <div className="flex h-6 items-center gap-3 text-sm text-muted-foreground">
                left
                <Separator orientation="vertical" />
                right
              </div>
            </div>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Badges & status */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Badges & status"
          description="Small signals — counts, tones, dots, chips."
        />
        <DemoGrid>
          <Demo label="Badge">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>neutral</Badge>
              <Badge variant="brand">brand</Badge>
              <Badge variant="success">success</Badge>
              <Badge variant="warning">warning</Badge>
              <Badge variant="danger">danger</Badge>
              <Badge variant="info">info</Badge>
              <Badge variant="outline" size="sm">
                outline sm
              </Badge>
              <Badge size="lg">lg</Badge>
            </div>
          </Demo>
          <Demo label="CountBadge">
            <div className="flex items-center gap-3">
              <CountBadge value={3} />
              <CountBadge value={128} max={99} variant="danger" />
              <CountBadge value={0} hideZero={false} variant="outline" />
            </div>
          </Demo>
          <Demo label="Tag (removable)">
            <div className="flex flex-wrap items-center gap-2">
              {tags.map((t) => (
                <Tag key={t} variant="brand" onClose={() => setTags((prev) => prev.filter((x) => x !== t))}>
                  {t}
                </Tag>
              ))}
              <Tag variant="success">static</Tag>
              {tags.length < INITIAL_TAGS.length && (
                <GhostButton onClick={() => setTags(INITIAL_TAGS)}>Reset</GhostButton>
              )}
            </div>
          </Demo>
          <Demo label="Status">
            <div className="flex flex-wrap items-center gap-4">
              <Status tone="success" pulse>
                Operational
              </Status>
              <Status tone="warning">Degraded</Status>
              <Status tone="destructive" size="sm">
                Outage
              </Status>
              <Status tone="info" size="xs">
                Info
              </Status>
            </div>
          </Demo>
          <Demo label="NotificationDot">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2 text-sm text-foreground">
                <NotificationDot tone="destructive" pulse /> alerts
              </span>
              <span className="flex items-center gap-2 text-sm text-foreground">
                <NotificationDot tone="success" size="sm" /> synced
              </span>
              <div className="relative h-10 w-10 rounded-md bg-muted">
                <NotificationDot tone="warning" position="top-right" />
              </div>
            </div>
          </Demo>
          <Demo label="BadgeOverlay">
            <div className="flex items-center gap-6">
              <BadgeOverlay badge={<CountBadge value={4} variant="danger" />}>
                <Avatar name="Inbox Bot" />
              </BadgeOverlay>
              <BadgeOverlay
                position="bottom-right"
                badge={<NotificationDot tone="success" size="sm" />}
              >
                <Avatar name="Maya K" autoColor />
              </BadgeOverlay>
            </div>
          </Demo>
          <Demo label="MetricChip">
            <div className="flex flex-wrap items-center gap-3">
              <MetricChip label="MRR" value="$4.2k" tone="success" />
              <MetricChip label="Churn" value="1.8%" tone="danger" size="md" />
              <MetricChip label="Build" value="0.0.412" size="xs" />
            </div>
          </Demo>
          <Demo label="AnnotationMarker" wide>
            <p className="max-w-prose text-sm leading-relaxed text-foreground">
              The new pricing model{' '}
              <AnnotationMarker index={1} tone="comment">
                increases ARPU by 18%
              </AnnotationMarker>{' '}
              compared to last quarter.{' '}
              <AnnotationMarker index={2} tone="suggestion">
                Consider a Q3 footnote
              </AnnotationMarker>{' '}
              so the chart matches the report.{' '}
              <AnnotationMarker index={3} tone="issue" resolved>
                This number was wrong
              </AnnotationMarker>{' '}
              — fixed in v2. A bare pin <AnnotationMarker index={4} tone="note" pinOnly /> can
              anchor a margin note, and{' '}
              <AnnotationMarker index={5} tone="note" active>
                this one is active
              </AnnotationMarker>
              .
            </p>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Identity & media basics */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Identity & images" description="Avatars, groups, and image fallbacks." />
        <DemoGrid>
          <Demo label="Avatar">
            <div className="flex items-center gap-3">
              <Avatar name="Sulton R" autoColor size="lg" />
              <Avatar name="Maya Kim" autoColor />
              <Avatar name="Tom Ito" size="sm" />
              <Avatar fallback={<span aria-hidden>★</span>} size="sm" />
            </div>
          </Demo>
          <Demo label="AvatarGroup">
            <AvatarGroup max={3} size="md">
              <Avatar name="Sulton R" autoColor />
              <Avatar name="Maya Kim" autoColor />
              <Avatar name="Tom Ito" autoColor />
              <Avatar name="Lena Park" autoColor />
              <Avatar name="Omar Aziz" autoColor />
            </AvatarGroup>
          </Demo>
          <Demo label="Image (loaded + fallback)">
            <div className="flex items-start gap-4">
              <Image src={IMG_OK} alt="Placeholder artwork" className="h-24 rounded-md" />
              <Image
                src={IMG_BROKEN}
                alt="Broken source"
                fallback={
                  <div className="flex h-24 w-36 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    image unavailable
                  </div>
                }
              />
            </div>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Cards & key-value */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Cards & key-value"
          description="Surfaces, stats, and label/value layouts."
        />
        <DemoGrid>
          <Demo label="Card (compound)">
            <Card>
              <Card.Header>
                <Card.Title>Usage report</Card.Title>
                <Card.Description>May 2026 · beta channel</Card.Description>
              </Card.Header>
              <Card.Body>
                <Text size="sm" color="muted">
                  412 builds published, 0 rollbacks.
                </Text>
              </Card.Body>
              <Card.Footer>
                <PrimaryButton>Open</PrimaryButton>
                <GhostButton>Dismiss</GhostButton>
              </Card.Footer>
            </Card>
          </Demo>
          <Demo label="Stat">
            <div className="flex flex-wrap gap-6">
              <Stat label="Weekly actives" value="8,412" trend={{ value: 12.4, label: 'vs last week' }} />
              <Stat
                label="Error rate"
                value="0.42%"
                size="sm"
                trend={{ value: -3.1 }}
                helper="last 24h"
              />
            </div>
          </Demo>
          <Demo label="EmptyState">
            <EmptyState
              size="sm"
              title="No deployments yet"
              description="Push to main to trigger the first build."
              actions={<PrimaryButton>New deployment</PrimaryButton>}
            />
          </Demo>
          <Demo label="DescriptionList">
            <DescriptionList
              items={[
                { label: 'Package', value: '@wow-two-beta/ui' },
                { label: 'Version', value: '0.0.412' },
                { label: 'License', value: 'MIT' },
              ]}
            />
          </Demo>
          <Demo label="DescriptionList (stacked)">
            <DescriptionList
              layout="stacked"
              density="sm"
              items={[
                { label: 'Region', value: 'eu-central-1' },
                { label: 'Runtime', value: 'node22' },
              ]}
            />
          </Demo>
          <Demo label="InfoRow">
            <div className="flex flex-col gap-1">
              <InfoRow label="Status" value={<Status tone="success">Live</Status>} />
              <InfoRow label="Owner" value="platform-team" />
              <InfoRow layout="stacked" label="Endpoint" value={<Code>api.wow-two.dev/v1</Code>} />
            </div>
          </Demo>
          <Demo label="MetaInline">
            <MetaInline actions={<GhostButton>Edit</GhostButton>}>
              <Badge size="sm" variant="brand">
                beta
              </Badge>
              <Text size="xs" color="muted">
                updated 2d ago
              </Text>
              <Text size="xs" color="subtle">
                · 14 files
              </Text>
            </MetaInline>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Disclosure */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Disclosure & hover"
          description="Accordions, collapsibles, tabs, tooltips, trees."
        />
        <DemoGrid>
          <Demo label="Accordion">
            <Accordion type="single" defaultValue="a" collapsible>
              <AccordionItem value="a">
                <AccordionTrigger>What is beta-forever?</AccordionTrigger>
                <AccordionContent>
                  <Text size="sm" color="muted">
                    The package stays 0.x — consumers pin exact versions and we fix forward.
                  </Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b">
                <AccordionTrigger>How are breaking changes handled?</AccordionTrigger>
                <AccordionContent>
                  <Text size="sm" color="muted">
                    Shipped normally; consumers update on their own cadence.
                  </Text>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c" disabled>
                <AccordionTrigger>Disabled item</AccordionTrigger>
                <AccordionContent>
                  <Text size="sm">Hidden.</Text>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Demo>
          <Demo label="Collapsible">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger>
                <GhostButton>Toggle build log</GhostButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Code variant="block" className="mt-2">{`> tsup src/index.ts
ESM ⚡ build success in 412ms`}</Code>
              </CollapsibleContent>
            </Collapsible>
          </Demo>
          <Demo label="Tooltip">
            <div className="flex items-center gap-4">
              <Tooltip content="Copies the install command" openDelay={150}>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-sm text-foreground hover:bg-muted"
                >
                  Hover me
                </button>
              </Tooltip>
              <Tooltip content="Placed to the right" placement="right" openDelay={150}>
                <span className="cursor-help text-sm text-muted-foreground underline decoration-dotted">
                  right placement
                </span>
              </Tooltip>
            </div>
          </Demo>
          <Demo label="Tabs">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTab value="overview">Overview</TabsTab>
                <TabsTab value="api">API</TabsTab>
                <TabsTab value="changelog" disabled>
                  Changelog
                </TabsTab>
              </TabsList>
              <TabsPanel value="overview">
                <Text size="sm" color="muted" className="pt-2">
                  High-level summary of the display domain.
                </Text>
              </TabsPanel>
              <TabsPanel value="api">
                <Text size="sm" color="muted" className="pt-2">
                  Sixty-six folders, each a named export.
                </Text>
              </TabsPanel>
            </Tabs>
          </Demo>
          <Demo label="Tree">
            <Tree defaultExpanded={['src', 'display']} defaultSelectedValue="badge">
              <TreeGroup value="src" label="src">
                <TreeGroup value="display" label="display">
                  <TreeItem value="badge">Badge.tsx</TreeItem>
                  <TreeItem value="card">Card.tsx</TreeItem>
                  <TreeItem value="locked" disabled>
                    Internal.ts
                  </TreeItem>
                </TreeGroup>
                <TreeItem value="index">index.ts</TreeItem>
              </TreeGroup>
              <TreeItem value="readme">README.md</TreeItem>
            </Tree>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Lists & feeds */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Lists & feeds" description="Lists, timelines, activity, swipe rows." />
        <DemoGrid>
          <Demo label="List / ListItem">
            <div className="flex gap-8">
              <List marker="check" spacing="tight">
                <ListItem showCheckMarker>Tokens wired</ListItem>
                <ListItem showCheckMarker>Stories written</ListItem>
                <ListItem showCheckMarker>Gallery rendered</ListItem>
              </List>
              <List ordered marker="decimal" spacing="tight">
                <ListItem trailing={<Badge size="sm">new</Badge>}>Install</ListItem>
                <ListItem>Import</ListItem>
                <ListItem>Compose</ListItem>
              </List>
            </div>
          </Demo>
          <Demo label="Timeline">
            <Timeline>
              <TimelineItem status="success">
                <TimelineTitle>Build passed</TimelineTitle>
                <TimelineDescription>CI green on main · #412</TimelineDescription>
              </TimelineItem>
              <TimelineItem status="primary">
                <TimelineTitle>Version bumped</TimelineTitle>
                <TimelineDescription>0.0.411 → 0.0.412</TimelineDescription>
              </TimelineItem>
              <TimelineItem status="warning">
                <TimelineTitle>Consumer pinned</TimelineTitle>
                <TimelineDescription>haven holds 0.0.398</TimelineDescription>
              </TimelineItem>
            </Timeline>
          </Demo>
          <Demo label="ActivityFeed">
            <ActivityFeed dense>
              <ActivityFeed.Item
                avatar={<Avatar name="Maya Kim" size="xs" autoColor />}
                timestamp="2h ago"
                actions={<GhostButton>Reply</GhostButton>}
              >
                <strong>Maya</strong> commented on <strong>Badge</strong>
              </ActivityFeed.Item>
              <ActivityFeed.Item
                avatar={<Avatar name="Tom Ito" size="xs" autoColor />}
                timestamp="4h ago"
                preview={
                  <div className="rounded-md border border-border bg-muted p-2 text-xs text-muted-foreground">
                    “Can we soften the danger tone?”
                  </div>
                }
              >
                <strong>Tom</strong> opened a thread
              </ActivityFeed.Item>
              <ActivityFeed.Item
                avatar={<Avatar name="CI Bot" size="xs" />}
                timestamp="6h ago"
                last
              >
                <strong>CI</strong> published <Code>0.0.412</Code>
              </ActivityFeed.Item>
            </ActivityFeed>
          </Demo>
          <Demo label="SwipeActions (drag the row)">
            <div className="divide-y divide-border rounded-md border border-border bg-card">
              <SwipeActions
                left={<SwipeActionButton tone="bg-primary" label="Pin" />}
                right={
                  <>
                    <SwipeActionButton tone="bg-warning" label="Archive" />
                    <SwipeActionButton tone="bg-destructive" label="Delete" />
                  </>
                }
              >
                <div className="flex items-center gap-3 p-3">
                  <Avatar name="Release Notes" size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      0.0.412 release notes
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      Drag left or right to reveal actions…
                    </div>
                  </div>
                </div>
              </SwipeActions>
            </div>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Tables */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Tables & grids" description="Static table, sortable DataTable, editable DataGrid." />
        <DemoGrid>
          <Demo label="Table (compound)" wide>
            <Table striped hoverable density="compact">
              <TableCaption>Subpath exports by domain</TableCaption>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Domain</TableHeaderCell>
                  <TableHeaderCell>Components</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>display</TableCell>
                  <TableCell>66</TableCell>
                  <TableCell>
                    <Badge size="sm" variant="success">
                      shipped
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>overlays</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>
                    <Badge size="sm" variant="warning">
                      iterating
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>total</TableCell>
                  <TableCell>84</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </Demo>
          <Demo label="DataTable (sortable, click a row)" wide>
            <DataTable<Invoice>
              aria-label="Invoices"
              columns={INVOICE_COLUMNS}
              data={INVOICES}
              rowKey={(r) => r.id}
              defaultSortBy={{ columnKey: 'total', direction: 'desc' }}
              striped
              hoverable
              onRowClick={(r) => setPickedInvoice(r.id)}
            />
            <Text size="xs" color="muted" className="mt-2">
              {pickedInvoice ? `Selected: ${pickedInvoice}` : 'Click a row to select it.'}
            </Text>
          </Demo>
          <Demo label="DataGrid (editable cells)" wide>
            <DataGrid<GridRow>
              columns={[
                { key: 'name', header: 'Name', accessor: (r) => r.name, type: 'text' },
                { key: 'points', header: 'Points', accessor: (r) => r.points, type: 'number', align: 'right' },
                {
                  key: 'role',
                  header: 'Role',
                  accessor: (r) => r.role,
                  type: 'select',
                  options: [
                    { value: 'admin', label: 'Admin' },
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                  ],
                },
                { key: 'active', header: 'Active', accessor: (r) => r.active, type: 'boolean', align: 'center' },
              ]}
              rows={gridRows}
              rowKey={(r) => r.id}
              onRowChange={(row, key, value) =>
                setGridRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)))
              }
            />
            <Text size="xs" color="muted" className="mt-2">
              Click a cell to edit · Enter commits · Escape reverts.
            </Text>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Numbers & viz */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Numbers & data viz" description="Animated values, sparklines, heatmaps, waveforms." />
        <DemoGrid>
          <Demo label="AnimatedNumber">
            <div className="flex items-center gap-4">
              <AnimatedNumber
                value={metric}
                format={(v) => `$${Math.round(v).toLocaleString('en-US')}`}
                className="text-2xl font-semibold text-foreground"
              />
              <GhostButton onClick={() => setMetric((m) => m + 250)}>+250</GhostButton>
              <GhostButton onClick={() => setMetric(1240)}>Reset</GhostButton>
            </div>
          </Demo>
          <Demo label="CountUp">
            <CountUp
              to={12800}
              duration={1500}
              format={(v) => Math.round(v).toLocaleString('en-US')}
              className="text-2xl font-semibold text-foreground"
            />
            <Text size="xs" color="muted">
              downloads since beta
            </Text>
          </Demo>
          <Demo label="Sparkline">
            <div className="flex items-end gap-6">
              <Sparkline data={SPARK_DATA} ariaLabel="Upward trend" showLast />
              <Sparkline data={SPARK_DATA} variant="area" tone="success" ariaLabel="Area trend" />
              <Sparkline data={SPARK_FLAT} variant="bar" tone="danger" ariaLabel="Downward bars" />
              <Sparkline data={SPARK_FLAT} variant="dot" tone="muted" ariaLabel="Dot series" />
            </div>
          </Demo>
          <Demo label="AudioWaveform (click to seek)">
            <AudioWaveform
              peaks={WAVE_PEAKS}
              progress={waveProgress}
              interactive
              onSeek={setWaveProgress}
              width={280}
              height={48}
            />
            <Text size="xs" color="muted">
              progress {(waveProgress * 100).toFixed(0)}%
            </Text>
          </Demo>
          <Demo label="HeatmapCalendar" wide>
            <HeatmapCalendar values={HEATMAP_VALUES} year={2026} tone="success" showLegend />
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Scheduling */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Scheduling" description="Calendar, resource schedule, gantt." />
        <DemoGrid>
          <Demo label="EventCalendar" wide>
            <EventCalendar
              events={CAL_EVENTS}
              defaultView="month"
              defaultDate={new Date(2026, 5, 10)}
              onEventClick={(e) => setPickedEvent(String(e.id))}
            />
            <Text size="xs" color="muted" className="mt-2">
              {pickedEvent ? `Clicked event: ${pickedEvent}` : 'Click an event.'}
            </Text>
          </Demo>
          <Demo label="ScheduleView" wide>
            <ScheduleView
              resources={SCHEDULE_RESOURCES}
              bookings={SCHEDULE_BOOKINGS}
              date={new Date(2026, 5, 10)}
              hourRange={[8, 18]}
            />
          </Demo>
          <Demo label="Gantt" wide>
            <Gantt
              tasks={GANTT_TASKS}
              dependencies={GANTT_DEPS}
              milestones={GANTT_MILESTONES}
              from={new Date(2026, 5, 1)}
              to={new Date(2026, 5, 28)}
            />
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Media & documents */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Media & documents"
          description="Players render a missing-source state — no bundled samples."
        />
        <DemoGrid>
          <Demo label="AudioPlayer (no source)">
            <AudioPlayer src="" peaks={WAVE_PEAKS} defaultVolume={0.8} />
          </Demo>
          <Demo label="VideoPlayer (no source)">
            <VideoPlayer src="" poster={IMG_OK} aspectRatio="16/9" />
          </Demo>
          <Demo label="PDFViewer (no source)">
            <PDFViewer src="" title="quarterly-report.pdf" height="220px" />
          </Demo>
          <Demo label="Carousel" wide>
            <div className="max-w-md">
              <Carousel loop>
                <CarouselViewport>
                  <CarouselSlides>
                    {CAROUSEL_SLIDES.map((s) => (
                      <CarouselSlide key={s.label}>
                        <div
                          className={`flex h-40 items-center justify-center text-xl font-medium text-foreground ${s.tone}`}
                        >
                          {s.label}
                        </div>
                      </CarouselSlide>
                    ))}
                  </CarouselSlides>
                  <CarouselPrev />
                  <CarouselNext />
                </CarouselViewport>
                <CarouselDots />
              </Carousel>
            </div>
          </Demo>
          <Demo label="DiffViewer" wide>
            <div className="mb-2 flex gap-2">
              <GhostButton onClick={() => setDiffView('split')}>Split</GhostButton>
              <GhostButton onClick={() => setDiffView('unified')}>Unified</GhostButton>
            </div>
            <DiffViewer
              left={DIFF_LEFT}
              right={DIFF_RIGHT}
              view={diffView}
              leftLabel="greet.js (old)"
              rightLabel="greet.js (new)"
              showStats
            />
          </Demo>
          <Demo label="NodeEditor (drag nodes, wheel zooms)" wide>
            <NodeEditor nodes={nodes} edges={NODE_EDITOR_EDGES} onNodesChange={setNodes} />
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Motion & effects */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Motion & effects" description="Marquee, reveal, tilt, confetti." />
        <DemoGrid>
          <Demo label="Marquee" wide>
            <Marquee speed={18} pauseOnHover gap={16}>
              {INITIAL_TAGS.concat(['storybook', 'tokens', 'beta-forever']).map((t) => (
                <Tag key={t} variant="info">
                  {t}
                </Tag>
              ))}
            </Marquee>
          </Demo>
          <Demo label="ScrollReveal">
            <ScrollReveal effect="slide-up" duration={500} once>
              <div className="rounded-md border border-border bg-muted p-4 text-sm text-foreground">
                Revealed when scrolled into view.
              </div>
            </ScrollReveal>
          </Demo>
          <Demo label="Tilt (hover)">
            <Tilt maxAngle={10} glare>
              <div className="flex h-28 items-center justify-center rounded-lg border border-border bg-card text-sm font-medium text-card-foreground">
                Tilt me
              </div>
            </Tilt>
          </Demo>
          <Demo label="Confetti (click to fire)">
            <Confetti ref={confettiRef} />
            <PrimaryButton onClick={() => confettiRef.current?.fire({ particleCount: 80 })}>
              Celebrate
            </PrimaryButton>
          </Demo>
        </DemoGrid>
      </section>

      {/* ------------------------------------------------ Conversation */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Conversation" description="Bubbles, reactions, message stream, threads, comments." />
        <DemoGrid>
          <Demo label="ChatBubble">
            <div className="flex flex-col gap-2">
              <ChatBubble side="start" author="Maya" avatar={<Avatar name="Maya Kim" size="xs" autoColor />} timestamp="09:12">
                Did the display gallery land?
              </ChatBubble>
              <ChatBubble side="end" tone="primary" status="read" timestamp="09:13">
                Yep — all 66 components on one page.
              </ChatBubble>
              <ChatBubble side="end" tone="primary" status="sending" tailless>
                Coverage manifest should be green now.
              </ChatBubble>
              <ChatBubble tone="system">Tom joined the channel</ChatBubble>
            </div>
          </Demo>
          <Demo label="ReactionBar (click to toggle)">
            <ReactionBar reactions={reactions} onReact={toggleReaction} onAdd={addReaction} />
            <Text size="xs" color="muted" className="mt-2">
              “+” adds a 🎉 reaction once.
            </Text>
          </Demo>
          <Demo label="MessageList" wide>
            <MessageList className="h-64 rounded-md border border-border bg-background p-3" header={<Text size="xs" color="muted" align="center" as="div">Beginning of conversation</Text>} footer={<Text size="xs" color="muted" as="div">Maya is typing…</Text>}>
              <MessageList.DaySeparator label="Yesterday" />
              <ChatBubble side="start" author="Maya" avatar={<Avatar name="Maya Kim" size="xs" autoColor />}>
                Pushed the token refactor.
              </ChatBubble>
              <ChatBubble side="end" tone="primary" status="read">
                Reviewing now.
              </ChatBubble>
              <MessageList.DaySeparator label="Today" />
              <ChatBubble side="start" author="Maya" avatar={<Avatar name="Maya Kim" size="xs" autoColor />}>
                Gallery page is up — scroll for the heatmap.
              </ChatBubble>
              <ChatBubble side="end" tone="primary" status="delivered" footer={<ReactionBar compact hideAddButton reactions={[{ key: 'up', emoji: '👍', count: 1, reactedByMe: true }]} />}>
                Looks great. Shipping it.
              </ChatBubble>
            </MessageList>
          </Demo>
          <Demo label="ThreadView" wide>
            <div className="max-w-md">
              <ThreadView
                title="Thread"
                subtitle="in #ui-beta"
                hideCloseButton
                replyCount="2 replies"
                parent={
                  <ChatBubble side="start" author="Tom" avatar={<Avatar name="Tom Ito" size="xs" autoColor />}>
                    Should Status pulse by default?
                  </ChatBubble>
                }
                composer={
                  <input
                    placeholder="Reply in thread…"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                  />
                }
              >
                <ChatBubble side="start" author="Maya" avatar={<Avatar name="Maya Kim" size="xs" autoColor />}>
                  Only for live states, I'd say.
                </ChatBubble>
                <ChatBubble side="end" tone="primary" status="read">
                  Agreed — opt-in via the pulse prop.
                </ChatBubble>
              </ThreadView>
            </div>
          </Demo>
          <Demo label="CommentThread" wide>
            <CommentThread>
              <CommentThread.Comment
                author="sulton"
                avatar={<Avatar name="Sulton R" size="sm" autoColor />}
                timestamp="3h ago"
                badge={
                  <Badge size="sm" variant="brand">
                    OP
                  </Badge>
                }
                highlighted
                actions={
                  <>
                    <GhostButton>Reply</GhostButton>
                    <GhostButton>Share</GhostButton>
                  </>
                }
                replies={
                  <CommentThread.Comment
                    author="maya"
                    avatar={<Avatar name="Maya Kim" size="sm" autoColor />}
                    timestamp="2h ago"
                    actions={<GhostButton>Reply</GhostButton>}
                  >
                    <Text size="sm">
                      Density over polish — exactly what a gallery should be.
                    </Text>
                  </CommentThread.Comment>
                }
              >
                <Text size="sm">
                  One page per domain, every component rendered at least once. Thoughts?
                </Text>
              </CommentThread.Comment>
            </CommentThread>
          </Demo>
        </DemoGrid>
      </section>
    </div>
  );
}
