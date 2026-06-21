import { useState, type ReactNode } from 'react';
import {
  Alert,
  AlertSimple,
  Banner,
  BannerSimple,
  Callout,
  InlineSpinner,
  LiveCursor,
  LoadingOverlay,
  LoadingState,
  MeterBar,
  NotificationCenter,
  OnboardingChecklist,
  OnboardingChecklistTask,
  PresenceIndicator,
  ProgressBar,
  ProgressCircle,
  ProgressSteps,
  Skeleton,
  Spinner,
  StatusIndicator,
  Toast,
  ToastSimple,
  Toaster,
  Tour,
  TrendIndicator,
  TypingIndicator,
  UndoBar,
  useToaster,
  type TourStep,
} from '@wow-two-beta/ui/feedback';
import { SectionHeader } from '@wow-two-beta/ui/display';
import { Button } from '@wow-two-beta/ui/actions';

/* ---------------------------------- helpers --------------------------------- */

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

/** Renders dismissible content; once closed, offers a "Show again" reset. */
function Dismissible({
  label,
  children,
}: {
  label: string;
  children: (onClose: () => void) => ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setVisible(true)}>
        Show {label} again
      </Button>
    );
  }
  return <>{children(() => setVisible(false))}</>;
}

/* ------------------------------- fixed demo data ----------------------------- */

const WIZARD_STEPS = ['Account', 'Profile', 'Review', 'Done'];

const CURSOR_POSITIONS = [
  [
    { x: 30, y: 24 },
    { x: 170, y: 70 },
  ],
  [
    { x: 120, y: 80 },
    { x: 60, y: 30 },
  ],
  [
    { x: 210, y: 40 },
    { x: 110, y: 96 },
  ],
] as const;

const TOUR_STEPS: TourStep[] = [
  {
    target: '#feedback-tour-start',
    title: 'Start here',
    body: 'This button launched the tour you are on right now.',
    placement: 'bottom',
  },
  {
    target: '#feedback-onboarding',
    title: 'Onboarding checklist',
    body: 'Progress is derived from the done state of each task.',
    placement: 'top',
  },
  {
    target: '#feedback-notification-center',
    title: 'Notification center',
    body: 'Dismiss rows or mark everything as read from the header.',
    placement: 'top',
  },
];

interface DemoNotification {
  id: number;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: DemoNotification[] = [
  { id: 1, title: 'Deploy finished', description: 'showcase v0.4.2 is live on staging.', timestamp: '2m', unread: true },
  { id: 2, title: 'New comment', description: 'Rin replied to your review on PR #218.', timestamp: '14m', unread: true },
  { id: 3, title: 'Weekly digest', description: '12 merged PRs, 3 new issues this week.', timestamp: '1d', unread: false },
];

/* ----------------------------------- page ----------------------------------- */

export default function FeedbackGallery() {
  const { toast } = useToaster();

  // Loading
  const [overlayOn, setOverlayOn] = useState(false);

  // Progress
  const [pct, setPct] = useState(40);
  const [meter, setMeter] = useState(45);
  const [wizardStep, setWizardStep] = useState(1);

  // Live cursors
  const [cursorFrame, setCursorFrame] = useState(0);

  // Flows
  const [undoOpen, setUndoOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tasksDone, setTasksDone] = useState({ invite: false, repo: false });
  const [notifications, setNotifications] = useState<DemoNotification[]>(INITIAL_NOTIFICATIONS);

  const frame = CURSOR_POSITIONS[cursorFrame % CURSOR_POSITIONS.length] ?? CURSOR_POSITIONS[0];
  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div className="space-y-12">
      {/* Mounted once for the whole page; triggered from the Toasts section. */}
      <Toaster position="bottom-right" defaultDuration={4000} />

      {/* ------------------------------ Alerts ------------------------------ */}
      <section className="space-y-4">
        <SectionHeader
          title="Alerts & Callouts"
          description="AlertSimple (atom) · Alert (slotted) · Callout (left-rule note)"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Demo label="AlertSimple — severities">
            <div className="space-y-2">
              <AlertSimple severity="info">Heads up — a new version is available.</AlertSimple>
              <AlertSimple severity="success">Payment received, invoice closed.</AlertSimple>
              <AlertSimple severity="warning">Storage is at 82% of quota.</AlertSimple>
              <AlertSimple severity="danger">Build failed on main.</AlertSimple>
              <AlertSimple severity="neutral">Maintenance window: Sunday 02:00–04:00.</AlertSimple>
            </div>
          </Demo>
          <Demo label="Alert — slotted, dismissible, with actions">
            <Dismissible label="alert">
              {(close) => (
                <Alert
                  severity="warning"
                  title="Certificate expires soon"
                  description="The TLS certificate for api.example.dev expires in 6 days."
                  actions={
                    <>
                      <Button size="sm" variant="soft" tone="warning" onClick={() => toast({ severity: 'success', title: 'Renewal scheduled' })}>
                        Renew now
                      </Button>
                      <Button size="sm" variant="ghost" onClick={close}>
                        Remind me later
                      </Button>
                    </>
                  }
                  onClose={close}
                />
              )}
            </Dismissible>
          </Demo>
          <Demo label="Callout — doc-style notes">
            <div className="space-y-2">
              <Callout severity="info" title="Note">
                Subpath imports keep the bundle lean — never import from the package root.
              </Callout>
              <Callout severity="danger" title="Breaking">
                Pickers now use <code className="text-xs">onValueChange</code> instead of <code className="text-xs">onChange</code>.
              </Callout>
            </div>
          </Demo>
        </div>
      </section>

      {/* ------------------------------ Banners ----------------------------- */}
      <section className="space-y-4">
        <SectionHeader
          title="Banners"
          description="BannerSimple (atom) · Banner (slotted, full-width broadcast)"
        />
        <div className="space-y-3">
          <Demo label="BannerSimple — severities">
            <div className="space-y-2">
              <BannerSimple severity="info">Scheduled maintenance starts in 30 minutes.</BannerSimple>
              <BannerSimple severity="neutral">You are viewing a read-only archive.</BannerSimple>
            </div>
          </Demo>
          <Demo label="Banner — slotted, dismissible, with action">
            <Dismissible label="banner">
              {(close) => (
                <Banner
                  severity="success"
                  title="Trial upgraded"
                  description="Your workspace is now on the Team plan."
                  actions={
                    <Button size="sm" variant="glass" onClick={() => toast({ severity: 'info', title: 'Opening billing…' })}>
                      View billing
                    </Button>
                  }
                  onClose={close}
                />
              )}
            </Dismissible>
          </Demo>
        </div>
      </section>

      {/* ------------------------------ Loading ----------------------------- */}
      <section className="space-y-4">
        <SectionHeader
          title="Loading"
          description="Spinner · InlineSpinner · Skeleton · LoadingState · LoadingOverlay"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Demo label="Spinner — sizes & tones">
            <div className="flex items-center gap-4">
              <Spinner size="xs" />
              <Spinner size="sm" />
              <Spinner size="md" />
              <Spinner size="lg" tone="brand" />
              <Spinner size="xl" tone="muted" />
            </div>
          </Demo>
          <Demo label="InlineSpinner — in-flow loading">
            <div className="space-y-2">
              <InlineSpinner />
              <InlineSpinner tone="brand">Syncing repositories…</InlineSpinner>
            </div>
          </Demo>
          <Demo label="Skeleton — composite placeholder">
            <div className="flex items-start gap-3">
              <Skeleton shape="circle" className="h-10 w-10" />
              <div className="flex-1 space-y-2">
                <Skeleton shape="text" className="w-3/4" />
                <Skeleton shape="text" className="w-1/2" />
                <Skeleton shape="rect" className="h-16 w-full" />
              </div>
            </div>
          </Demo>
          <Demo label="LoadingState — section-level">
            <LoadingState
              size="md"
              className="py-6"
              title="Loading workspace…"
              description="Fetching projects and members."
            />
          </Demo>
          <Demo label="LoadingOverlay — scoped, toggleable">
            <div className="relative h-32 overflow-hidden rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
              Region content stays behind the scrim while work is in flight.
              <LoadingOverlay isOpen={overlayOn} isInline hasBlur label="Syncing…" spinnerSize="md" />
            </div>
            <Button size="sm" variant="outline" onClick={() => setOverlayOn((v) => !v)}>
              {overlayOn ? 'Stop loading' : 'Start loading'}
            </Button>
          </Demo>
        </div>
      </section>

      {/* ------------------------------ Progress ---------------------------- */}
      <section className="space-y-4">
        <SectionHeader
          title="Progress"
          description="ProgressBar · ProgressCircle · MeterBar · ProgressSteps"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Demo label="ProgressBar — determinate + indeterminate">
            <div id="feedback-progress" className="space-y-3">
              <ProgressBar value={pct} label="Upload progress" />
              <ProgressBar value={pct} size="lg" tone="success" label="Upload progress (lg)" />
              <ProgressBar size="sm" label="Indeterminate" />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPct((v) => Math.max(0, v - 10))}>
                  −10
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPct((v) => Math.min(100, v + 10))}>
                  +10
                </Button>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
            </div>
          </Demo>
          <Demo label="ProgressCircle — determinate + indeterminate">
            <div className="flex items-center gap-6">
              <ProgressCircle value={pct} label="Upload progress" />
              <ProgressCircle value={pct} size={56} thickness={6} tone="success" label="Upload (large)" />
              <ProgressCircle label="Indeterminate" tone="neutral" />
            </div>
          </Demo>
          <Demo label="MeterBar — threshold zones">
            <div className="space-y-3">
              <MeterBar value={meter} thresholds={[60, 85]} label="Disk usage" />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setMeter((v) => Math.max(0, v - 15))}>
                  Free up
                </Button>
                <Button size="sm" variant="outline" onClick={() => setMeter((v) => Math.min(100, v + 15))}>
                  Fill
                </Button>
                <span className="text-xs text-muted-foreground">{meter} / 100 — green ≤60, amber ≤85, red above</span>
              </div>
            </div>
          </Demo>
          <Demo label="ProgressSteps — horizontal, driven">
            <div className="space-y-3">
              <ProgressSteps steps={WIZARD_STEPS} current={wizardStep} />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" isDisabled={wizardStep === 0} onClick={() => setWizardStep((s) => Math.max(0, s - 1))}>
                  Back
                </Button>
                <Button size="sm" isDisabled={wizardStep >= WIZARD_STEPS.length - 1} onClick={() => setWizardStep((s) => Math.min(WIZARD_STEPS.length - 1, s + 1))}>
                  Next
                </Button>
              </div>
            </div>
          </Demo>
          <Demo label="ProgressSteps — vertical">
            <ProgressSteps orientation="vertical" steps={['Clone', 'Install', 'Build']} current={1} />
          </Demo>
        </div>
      </section>

      {/* ----------------------------- Indicators ---------------------------- */}
      <section className="space-y-4">
        <SectionHeader
          title="Indicators"
          description="StatusIndicator · PresenceIndicator · TrendIndicator · TypingIndicator · LiveCursor"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Demo label="StatusIndicator — monitoring rows">
            <div className="space-y-3">
              <StatusIndicator tone="success" hasPulse label="All systems normal" description="Updated 2m ago" />
              <StatusIndicator tone="warning" label="Elevated API latency" description="p95 at 840ms" />
              <StatusIndicator tone="destructive" label="Webhooks degraded" description="Investigating since 09:12" />
              <StatusIndicator tone="neutral" label="Maintenance mode" description="Deploys paused" />
            </div>
          </Demo>
          <Demo label="PresenceIndicator — statuses + avatar overlay">
            <div className="flex items-center gap-4">
              <PresenceIndicator status="online" hasPulse />
              <PresenceIndicator status="idle" />
              <PresenceIndicator status="busy" />
              <PresenceIndicator status="offline" />
              <PresenceIndicator status="invisible" />
              <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                RK
                <PresenceIndicator status="online" size="md" position="bottom-right" />
              </span>
            </div>
          </Demo>
          <Demo label="TrendIndicator — deltas">
            <div className="flex flex-wrap items-center gap-4">
              <TrendIndicator value={12.4} label="vs last week" />
              <TrendIndicator value={-3.2} label="vs last week" />
              <TrendIndicator value={0} label="flat" />
              <TrendIndicator value={8.1} isInverse label="error rate" />
            </div>
          </Demo>
          <Demo label="TypingIndicator — chat affordance">
            <div className="space-y-2">
              <TypingIndicator who="Rin" />
              <TypingIndicator size="lg" tone="primary" />
              <TypingIndicator who="3 people" isSubtle tone="foreground" />
            </div>
          </Demo>
          <Demo label="LiveCursor — collaborative canvas">
            <div className="relative h-32 overflow-hidden rounded-md border border-border bg-muted">
              <LiveCursor x={frame[0].x} y={frame[0].y} name="Rin" />
              <LiveCursor x={frame[1].x} y={frame[1].y} name="Sol" color="var(--color-success)" />
            </div>
            <Button size="sm" variant="outline" onClick={() => setCursorFrame((f) => f + 1)}>
              Move cursors
            </Button>
          </Demo>
        </div>
      </section>

      {/* ------------------------------- Toasts ------------------------------ */}
      <section className="space-y-4">
        <SectionHeader
          title="Toasts"
          description="ToastSimple (atom) · Toast (slotted) · Toaster (queue, mounted once per app)"
        />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Demo label="ToastSimple — free-form children">
            <ToastSimple severity="info">
              <span className="font-medium">Sync complete.</span> 14 files updated.
            </ToastSimple>
          </Demo>
          <Demo label="Toast — slotted, dismissible">
            <Dismissible label="toast">
              {(close) => (
                <Toast
                  severity="success"
                  title="Export ready"
                  description="report-2026-06.csv (1.2 MB)"
                  actions={
                    <Button size="sm" variant="soft" onClick={() => toast({ severity: 'info', title: 'Download started' })}>
                      Download
                    </Button>
                  }
                  onClose={close}
                />
              )}
            </Dismissible>
          </Demo>
          <Demo label="Toaster — fire into the global queue">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => toast({ severity: 'success', title: 'Saved', description: 'All changes persisted.' })}>
                Success toast
              </Button>
              <Button size="sm" variant="outline" tone="danger" onClick={() => toast({ severity: 'danger', title: 'Build failed', description: 'tsc exited with code 2.' })}>
                Danger toast
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  toast({
                    severity: 'info',
                    title: 'Update available',
                    description: 'v0.5.0 is ready to install.',
                    duration: Infinity,
                    action: (
                      <Button size="sm" variant="soft" onClick={() => toast({ severity: 'success', title: 'Updating…' })}>
                        Install
                      </Button>
                    ),
                  })
                }
              >
                Sticky toast with action
              </Button>
            </div>
          </Demo>
        </div>
      </section>

      {/* --------------------------- Flows & surfaces ------------------------ */}
      <section className="space-y-4">
        <SectionHeader
          title="Flows & Surfaces"
          description="UndoBar · OnboardingChecklist · NotificationCenter · Tour"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Demo label="UndoBar — destructive action with undo">
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" tone="danger" onClick={() => setUndoOpen(true)}>
                Archive conversation
              </Button>
              <span className="text-xs text-muted-foreground">Snackbar appears bottom-center with a countdown.</span>
            </div>
            <UndoBar
              isOpen={undoOpen}
              onOpenChange={setUndoOpen}
              message="Conversation archived."
              duration={4000}
              hasCountdown
              onUndo={() => toast({ severity: 'info', title: 'Restored', description: 'Conversation moved back to inbox.' })}
            />
          </Demo>
          <Demo label="Tour — multi-step spotlight">
            <div className="flex flex-wrap items-center gap-2">
              <Button id="feedback-tour-start" size="sm" onClick={() => setTourOpen(true)}>
                Start tour
              </Button>
              <span className="text-xs text-muted-foreground">3 steps · Esc to skip.</span>
            </div>
            <Tour
              isOpen={tourOpen}
              onOpenChange={setTourOpen}
              steps={TOUR_STEPS}
              onComplete={() => toast({ severity: 'success', title: 'Tour complete' })}
            />
          </Demo>
          <Demo label="OnboardingChecklist — derived progress">
            <div id="feedback-onboarding">
              <OnboardingChecklist title="Set up your workspace">
                <OnboardingChecklistTask isDone label="Create account" description="Done during sign-up." />
                <OnboardingChecklistTask
                  isDone={tasksDone.invite}
                  label="Invite your team"
                  description="Add at least one teammate."
                  action={
                    <Button size="sm" variant="soft" onClick={() => setTasksDone((t) => ({ ...t, invite: true }))}>
                      Invite
                    </Button>
                  }
                />
                <OnboardingChecklistTask
                  isDone={tasksDone.repo}
                  label="Connect a repository"
                  description="Link GitHub to enable deploys."
                  action={
                    <Button size="sm" variant="soft" onClick={() => setTasksDone((t) => ({ ...t, repo: true }))}>
                      Connect
                    </Button>
                  }
                />
              </OnboardingChecklist>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setTasksDone({ invite: false, repo: false })}>
              Reset tasks
            </Button>
          </Demo>
          <Demo label="NotificationCenter — items, dismiss, mark read">
            <div id="feedback-notification-center" className="inline-block">
              <NotificationCenter
                count={unreadCount > 0 ? unreadCount : undefined}
                headerActions={
                  <Button size="sm" variant="ghost" onClick={() => setNotifications((ns) => ns.map((n) => ({ ...n, unread: false })))}>
                    Mark all read
                  </Button>
                }
                footer={
                  <Button variant="link" size="sm" onClick={() => toast({ severity: 'info', title: 'Opening inbox…' })}>
                    View all
                  </Button>
                }
              >
                {notifications.map((n) => (
                  <NotificationCenter.Item
                    key={n.id}
                    title={n.title}
                    description={n.description}
                    timestamp={n.timestamp}
                    isUnread={n.unread}
                    onSelect={() => setNotifications((ns) => ns.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                    onDismiss={() => setNotifications((ns) => ns.filter((x) => x.id !== n.id))}
                  />
                ))}
              </NotificationCenter>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setNotifications(INITIAL_NOTIFICATIONS)}>
              Reset notifications
            </Button>
          </Demo>
        </div>
      </section>
    </div>
  );
}
