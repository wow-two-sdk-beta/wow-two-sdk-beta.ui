import { useEffect, useMemo, useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import {
  ActivityFeed,
  ActivityItem as ActivityFeedItem,
  Avatar,
  Badge,
  EmptyState,
  List,
  ListItem,
  SwipeActions,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@wow-two-beta/ui/display';
import {
  LiveCursor,
  NotificationCenter,
  NotificationItem,
  Skeleton,
  UndoBar,
  useToaster,
} from '@wow-two-beta/ui/feedback';
import { SearchInput } from '@wow-two-beta/ui/forms';
import { PullToRefresh } from '@wow-two-beta/ui/layout';
import { Icon, type IconAdapter } from '@wow-two-beta/ui/icons';
import {
  activityItems,
  usersById,
  type ActivityItem as ActivityRecord,
} from '../../fixtures';

/* ------------------------------------------------------------------ */
/* Inline glyphs (lucide-shaped adapters — showcase has no icon dep)   */
/* ------------------------------------------------------------------ */

function glyph(paths: React.ReactNode): IconAdapter {
  return function Glyph({ size = 20, ...props }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

const ArchiveGlyph = glyph(
  <>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </>,
);

const TrashGlyph = glyph(
  <>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </>,
);

const BellGlyph = glyph(
  <>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>,
);

const InboxGlyph = glyph(
  <>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </>,
);

const RestoreGlyph = glyph(
  <>
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
  </>,
);

/* ------------------------------------------------------------------ */
/* Deterministic helpers                                               */
/* ------------------------------------------------------------------ */

/** Fixed "now" anchor — keeps relative timestamps deterministic. */
const NOW_MS = Date.parse('2026-06-12T10:00:00Z');

function relativeTime(iso: string): string {
  const diffMin = Math.max(0, Math.round((NOW_MS - Date.parse(iso)) / 60_000));
  if (diffMin < 1) return 'now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return diffD === 1 ? 'yesterday' : `${diffD}d ago`;
}

function actorName(id: string): string {
  return usersById[id]?.name ?? 'Someone';
}

/** Verbs that read as "you were pulled in" — feeds the Mentions tab. */
const MENTION_VERBS: ReadonlySet<ActivityRecord['verb']> = new Set([
  'commented',
  'invited',
]);

type Bucket = 'inbox' | 'archived' | 'deleted';

interface RowState {
  bucket: Bucket;
  read: boolean;
}

function initialRows(): Record<string, RowState> {
  const out: Record<string, RowState> = {};
  for (const item of activityItems) {
    out[item.id] = { bucket: 'inbox', read: item.read };
  }
  return out;
}

interface UndoSnapshot {
  id: string;
  prevBucket: Bucket;
  label: string;
}

/** Fixed waypoint loop for the simulated collaborator cursor. */
const CURSOR_WAYPOINTS = [
  { x: 60, y: 90 },
  { x: 300, y: 150 },
  { x: 520, y: 110 },
  { x: 420, y: 320 },
  { x: 180, y: 380 },
  { x: 90, y: 220 },
] as const;

/* ------------------------------------------------------------------ */
/* Sub-blocks                                                          */
/* ------------------------------------------------------------------ */

function RowSkeletons({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-4 p-4" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton shape="circle" className="h-9 w-9" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton shape="text" className="h-3 w-3/4" />
            <Skeleton shape="text" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SwipeSlotButton({
  tone,
  icon,
  label,
  onClick,
}: {
  tone: 'archive' | 'delete' | 'restore';
  icon: IconAdapter;
  label: string;
  onClick: () => void;
}) {
  const toneClass =
    tone === 'delete'
      ? 'bg-destructive text-destructive-foreground'
      : tone === 'archive'
        ? 'bg-warning text-warning-foreground'
        : 'bg-primary text-primary-foreground';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium ${toneClass}`}
    >
      <Icon icon={icon} size={16} />
      <span>{label}</span>
    </button>
  );
}

function NotificationRow({
  item,
  unread,
  trailing,
}: {
  item: ActivityRecord;
  unread: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar name={actorName(item.actorId)} autoColor size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">
          <span className={unread ? 'font-semibold' : 'font-medium'}>
            {actorName(item.actorId)}
          </span>{' '}
          {item.verb}{' '}
          <span className="text-muted-foreground">{item.target}</span>
        </p>
        <p className="text-xs text-subtle-foreground">{relativeTime(item.at)}</p>
      </div>
      {unread && (
        <span
          aria-label="Unread"
          className="h-2 w-2 shrink-0 rounded-full bg-primary"
        />
      )}
      {trailing}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function InboxScreen() {
  const { toast } = useToaster();

  const [booting, setBooting] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Record<string, RowState>>(initialRows);
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [undoOpen, setUndoOpen] = useState(false);
  const [undoSnap, setUndoSnap] = useState<UndoSnapshot | null>(null);
  const [cursorStep, setCursorStep] = useState(0);

  /* Initial load — brief skeleton pass. */
  useEffect(() => {
    const handle = window.setTimeout(() => setBooting(false), 900);
    return () => window.clearTimeout(handle);
  }, []);

  /* Simulated collaborator wandering the hub. */
  useEffect(() => {
    const handle = window.setInterval(
      () => setCursorStep((s) => (s + 1) % CURSOR_WAYPOINTS.length),
      1400,
    );
    return () => window.clearInterval(handle);
  }, []);

  const bucketOf = (id: string): Bucket => rows[id]?.bucket ?? 'deleted';
  const isUnread = (id: string): boolean => !(rows[id]?.read ?? true);

  const matchesQuery = (item: ActivityRecord): boolean => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      item.target.toLowerCase().includes(q) ||
      item.verb.includes(q) ||
      actorName(item.actorId).toLowerCase().includes(q)
    );
  };

  const inboxItems = useMemo(
    () => activityItems.filter((a) => bucketOf(a.id) === 'inbox' && matchesQuery(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, query],
  );
  const archivedItems = useMemo(
    () => activityItems.filter((a) => bucketOf(a.id) === 'archived' && matchesQuery(a)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, query],
  );
  const mentionItems = useMemo(
    () =>
      activityItems.filter(
        (a) => MENTION_VERBS.has(a.verb) && bucketOf(a.id) !== 'deleted',
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows],
  );

  const unreadInbox = inboxItems.filter((a) => isUnread(a.id));
  const allInboxCount = activityItems.filter((a) => bucketOf(a.id) === 'inbox').length;
  const allArchivedCount = activityItems.filter((a) => bucketOf(a.id) === 'archived').length;

  const collaborator = usersById['usr-005'];
  const waypoint = CURSOR_WAYPOINTS[cursorStep] ?? { x: 60, y: 90 };

  /* ---- mutations ------------------------------------------------- */

  const markRead = (id: string) => {
    setRows((prev) => {
      const cur = prev[id];
      if (!cur || cur.read) return prev;
      return { ...prev, [id]: { ...cur, read: true } };
    });
  };

  const markAllRead = () => {
    setRows((prev) => {
      const next: Record<string, RowState> = {};
      for (const [id, st] of Object.entries(prev)) next[id] = { ...st, read: true };
      return next;
    });
    toast({ title: 'All caught up', description: 'Every notification marked as read.', severity: 'success' });
  };

  const moveTo = (item: ActivityRecord, to: Bucket) => {
    const prevBucket = bucketOf(item.id);
    if (prevBucket === to) return;
    setRows((prev) => {
      const cur = prev[item.id];
      if (!cur) return prev;
      return { ...prev, [item.id]: { ...cur, bucket: to } };
    });
    const label =
      to === 'archived' ? 'Archived' : to === 'deleted' ? 'Deleted' : 'Restored';
    setUndoSnap({ id: item.id, prevBucket, label: `${label} "${item.target}"` });
    setUndoOpen(true);
    if (to === 'deleted') {
      toast({ title: 'Notification deleted', description: item.target, severity: 'danger' });
    } else if (to === 'archived') {
      toast({ title: 'Notification archived', description: item.target, severity: 'info' });
    }
  };

  const handleUndo = () => {
    if (!undoSnap) return;
    const { id, prevBucket } = undoSnap;
    setRows((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      return { ...prev, [id]: { ...cur, bucket: prevBucket } };
    });
    toast({ title: 'Action undone', severity: 'success' });
  };

  const handleRefresh = () =>
    new Promise<void>((resolve) => {
      setRefreshing(true);
      window.setTimeout(() => {
        setRefreshing(false);
        resolve();
      }, 600);
    });

  /* ---- render helpers -------------------------------------------- */

  const renderSwipeRow = (item: ActivityRecord, inArchive: boolean) => (
    <ListItem key={item.id} className="block gap-0 p-0">
      <SwipeActions
        className="rounded-none"
        left={
          inArchive ? (
            <SwipeSlotButton
              tone="restore"
              icon={RestoreGlyph}
              label="Restore"
              onClick={() => moveTo(item, 'inbox')}
            />
          ) : (
            <SwipeSlotButton
              tone="archive"
              icon={ArchiveGlyph}
              label="Archive"
              onClick={() => moveTo(item, 'archived')}
            />
          )
        }
        right={
          <SwipeSlotButton
            tone="delete"
            icon={TrashGlyph}
            label="Delete"
            onClick={() => moveTo(item, 'deleted')}
          />
        }
      >
        <NotificationRow
          item={item}
          unread={isUnread(item.id)}
          trailing={
            <span className="flex shrink-0 items-center gap-1">
              {inArchive ? (
                <Button
                  variant="ghost"
                  tone="neutral"
                  size="xs"
                  aria-label={`Restore ${item.target}`}
                  onClick={() => moveTo(item, 'inbox')}
                >
                  <Icon icon={RestoreGlyph} size={14} />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  tone="neutral"
                  size="xs"
                  aria-label={`Archive ${item.target}`}
                  onClick={() => moveTo(item, 'archived')}
                >
                  <Icon icon={ArchiveGlyph} size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                tone="danger"
                size="xs"
                aria-label={`Delete ${item.target}`}
                onClick={() => moveTo(item, 'deleted')}
              >
                <Icon icon={TrashGlyph} size={14} />
              </Button>
            </span>
          }
        />
      </SwipeActions>
    </ListItem>
  );

  const swipeHint = (
    <p className="px-4 py-2 text-xs text-subtle-foreground">
      Tip: drag a row sideways to reveal actions — or use the inline buttons.
    </p>
  );

  /* ---- screen ----------------------------------------------------- */

  return (
    <div className="relative mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Simulated collaborator cursor — animated through fixed waypoints. */}
      <LiveCursor
        x={waypoint.x}
        y={waypoint.y}
        name={collaborator?.name ?? 'Riley'}
      />

      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Icon icon={BellGlyph} size={22} className="text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">Notification hub</h1>
          {unreadInbox.length > 0 && (
            <Badge variant="brand" size="sm">
              {unreadInbox.length} unread
            </Badge>
          )}
        </div>
        <div className="ml-auto w-full sm:w-64">
          <SearchInput
            placeholder="Filter notifications…"
            aria-label="Filter notifications"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            size="sm"
          />
        </div>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Main column — tabs over the swipeable list. */}
        <section className="min-w-0 flex-1">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTab value="all">
                All
                <Badge variant="neutral" size="sm">{allInboxCount}</Badge>
              </TabsTab>
              <TabsTab value="mentions">
                Mentions
                <Badge variant="neutral" size="sm">{mentionItems.length}</Badge>
              </TabsTab>
              <TabsTab value="archive">
                Archive
                <Badge variant="neutral" size="sm">{allArchivedCount}</Badge>
              </TabsTab>
            </TabsList>

            {/* ---- All ---- */}
            <TabsPanel value="all">
              <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
                {booting ? (
                  <RowSkeletons count={6} />
                ) : (
                  <div className="h-[26rem]">
                    <PullToRefresh onRefresh={handleRefresh}>
                      {refreshing ? (
                        <RowSkeletons count={6} />
                      ) : inboxItems.length === 0 ? (
                        <EmptyState
                          icon={<Icon icon={InboxGlyph} size={28} />}
                          title="No notifications"
                          description={
                            query
                              ? 'Nothing matches your filter.'
                              : 'New activity lands here as it happens.'
                          }
                          actions={
                            query ? (
                              <Button
                                variant="outline"
                                tone="neutral"
                                size="sm"
                                onClick={() => setQuery('')}
                              >
                                Clear filter
                              </Button>
                            ) : undefined
                          }
                        />
                      ) : (
                        <>
                          {swipeHint}
                          <List marker="none" spacing="tight" className="divide-y divide-border">
                            {inboxItems.map((item) => renderSwipeRow(item, false))}
                          </List>
                        </>
                      )}
                    </PullToRefresh>
                  </div>
                )}
              </div>
            </TabsPanel>

            {/* ---- Mentions ---- */}
            <TabsPanel value="mentions">
              <div className="mt-3 rounded-lg border border-border bg-card p-5">
                {booting ? (
                  <RowSkeletons count={4} />
                ) : (
                  <ActivityFeed>
                    {mentionItems.map((item, idx) => (
                      <ActivityFeedItem
                        key={item.id}
                        avatar={<Avatar name={actorName(item.actorId)} autoColor size="sm" />}
                        timestamp={relativeTime(item.at)}
                        last={idx === mentionItems.length - 1}
                        preview={
                          item.verb === 'commented' ? item.target : undefined
                        }
                        actions={
                          <Button
                            variant="link"
                            tone="primary"
                            size="xs"
                            onClick={() => markRead(item.id)}
                          >
                            Mark read
                          </Button>
                        }
                      >
                        <span className="font-medium">{actorName(item.actorId)}</span>{' '}
                        {item.verb === 'invited' ? 'invited' : 'mentioned you on'}{' '}
                        <span className="text-muted-foreground">{item.target}</span>
                      </ActivityFeedItem>
                    ))}
                  </ActivityFeed>
                )}
              </div>
            </TabsPanel>

            {/* ---- Archive ---- */}
            <TabsPanel value="archive">
              <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
                {booting ? (
                  <RowSkeletons count={3} />
                ) : archivedItems.length === 0 ? (
                  <EmptyState
                    icon={<Icon icon={ArchiveGlyph} size={28} />}
                    title="Archive is empty"
                    description="Swipe a notification left-to-right (or hit the archive button) to stash it here."
                    actions={
                      <Button
                        variant="outline"
                        tone="neutral"
                        size="sm"
                        onClick={() => setTab('all')}
                      >
                        Back to all
                      </Button>
                    }
                  />
                ) : (
                  <List marker="none" spacing="tight" className="divide-y divide-border">
                    {archivedItems.map((item) => renderSwipeRow(item, true))}
                  </List>
                )}
              </div>
            </TabsPanel>
          </Tabs>
        </section>

        {/* Side column — NotificationCenter fed from the same state. */}
        <aside className="w-full shrink-0 lg:w-80">
          <NotificationCenter
            className="w-full"
            title="Unread"
            count={unreadInbox.length}
            headerActions={
              <Button
                variant="ghost"
                tone="neutral"
                size="xs"
                onClick={markAllRead}
              >
                Mark all read
              </Button>
            }
            emptyState={
              <EmptyState
                size="sm"
                icon={<Icon icon={BellGlyph} size={20} />}
                title="All clear"
                description="No unread notifications."
              />
            }
            footer={
              <Button
                variant="link"
                tone="primary"
                size="xs"
                onClick={() => setTab('all')}
              >
                View all activity
              </Button>
            }
          >
            {unreadInbox.slice(0, 6).map((item) => (
              <NotificationItem
                key={item.id}
                unread
                icon={<Avatar name={actorName(item.actorId)} autoColor size="xs" />}
                title={`${actorName(item.actorId)} ${item.verb}`}
                description={item.target}
                timestamp={relativeTime(item.at)}
                onSelect={() => markRead(item.id)}
                onDismiss={() => moveTo(item, 'archived')}
              />
            ))}
          </NotificationCenter>
        </aside>
      </div>

      <UndoBar
        open={undoOpen}
        onOpenChange={setUndoOpen}
        message={undoSnap?.label ?? ''}
        onUndo={handleUndo}
        duration={5000}
        showCountdown
        position="bottom-center"
      />
    </div>
  );
}
