import { useEffect, useMemo, useState } from 'react';
import { Button } from '@wow-two-beta/ui/actions';
import {
  Banner,
  Callout,
  LoadingOverlay,
  OnboardingChecklist,
  OnboardingChecklistTask,
  ProgressSteps,
  Tour,
  useToaster,
  type TourStep,
} from '@wow-two-beta/ui/feedback';
import {
  ChoiceCard,
  LabeledInput,
  RadioGroup,
  TextInput,
  Wizard,
  WizardFooter,
  WizardStep,
} from '@wow-two-beta/ui/forms';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@wow-two-beta/ui/overlays';
import { Announce } from '@wow-two-beta/ui/primitives';
import { users, type User } from '../../fixtures';

/* ------------------------------- fixed data ------------------------------- */

const WIZARD_STEP_IDS = ['details', 'plan', 'team', 'review'] as const;
type WizardStepId = (typeof WIZARD_STEP_IDS)[number];
const WIZARD_STEP_LABELS = ['Details', 'Plan', 'Team', 'Review'];

interface Plan {
  id: string;
  name: string;
  priceLabel: string;
  blurb: string;
}

const PLANS: Plan[] = [
  { id: 'starter', name: 'Starter', priceLabel: '$0 / mo', blurb: '1 project, community support, 7-day log retention.' },
  { id: 'team', name: 'Team', priceLabel: '$29 / mo', blurb: 'Unlimited projects, RBAC, 30-day log retention.' },
  { id: 'scale', name: 'Scale', priceLabel: '$99 / mo', blurb: 'SSO, audit log, dedicated support, 90-day retention.' },
];

/* First four teammates make a tidy invite list; owner is usr-001. */
const INVITEES: User[] = users.slice(1, 5);
const OWNER: User | undefined = users[0];

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="checklist"]',
    title: 'Setup checklist',
    body: 'Track first-run progress here. Items tick themselves off as you finish each task.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="wizard"]',
    title: 'Workspace setup wizard',
    body: 'Name the workspace, pick a plan, and invite teammates — four small steps.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="provisioning"]',
    title: 'Provisioning sandbox',
    body: 'Kick off a fake environment provision and watch the loading overlay block the region.',
    placement: 'top',
  },
  {
    target: '[data-tour="help"]',
    title: 'Need a refresher?',
    body: 'The help affordances live here — popover docs and an announcement demo.',
    placement: 'bottom',
  },
];

const STATUS_LABEL: Record<User['status'], string> = {
  online: 'Online',
  away: 'Away',
  dnd: 'Do not disturb',
  offline: 'Offline',
};

/* -------------------------------- helpers -------------------------------- */

function UserHoverCard({ user }: { user: User }) {
  return (
    <HoverCard openDelay={200} closeDelay={150} placement="top">
      <HoverCardTrigger>
        <button
          type="button"
          className="rounded text-sm font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {user.name}
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {user.initials}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground">{user.name}</div>
            <div className="text-xs text-muted-foreground">@{user.handle} · {user.role}</div>
            <div className="mt-1.5 text-xs text-muted-foreground">{user.email}</div>
            <div className="mt-1 text-xs text-subtle-foreground">{STATUS_LABEL[user.status]}</div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

/* --------------------------------- screen --------------------------------- */

export default function OnboardingScreen() {
  const { toast } = useToaster();

  /* Checklist flags. */
  const [tourDone, setTourDone] = useState(false);
  const [wizardDone, setWizardDone] = useState(false);
  const [invitesSent, setInvitesSent] = useState(false);
  const [provisionDone, setProvisionDone] = useState(false);

  /* Wizard state. */
  const [stepIndex, setStepIndex] = useState(0);
  const [workspaceName, setWorkspaceName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

  /* Page chrome state. */
  const [bannerOpen, setBannerOpen] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const planChosen = plan !== null;
  const doneCount = useMemo(
    () => [tourDone, wizardDone, planChosen, invitesSent, provisionDone].filter(Boolean).length,
    [tourDone, wizardDone, planChosen, invitesSent, provisionDone],
  );

  const selectedPlan = PLANS.find((p) => p.id === plan);

  /* Fake provisioning run — overlay blocks the box, then completes. */
  useEffect(() => {
    if (!provisioning) return;
    const handle = window.setTimeout(() => {
      setProvisioning(false);
      setProvisionDone(true);
      setAnnouncement('Environment provisioned.');
      toast({ severity: 'success', title: 'Environment ready', description: 'staging-eu-1 provisioned in 2.6s.' });
    }, 2600);
    return () => window.clearTimeout(handle);
  }, [provisioning, toast]);

  const toggleInvitee = (id: string) => {
    setSelectedInvitees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const completeWizard = () => {
    setWizardDone(true);
    if (selectedInvitees.length > 0) setInvitesSent(true);
    setAnnouncement(`Workspace ${workspaceName.trim() || 'untitled'} created.`);
    toast({
      severity: 'success',
      title: 'Workspace created',
      description: `${workspaceName.trim() || 'Untitled'} · ${selectedPlan?.name ?? 'No plan'} · ${selectedInvitees.length} invite${selectedInvitees.length === 1 ? '' : 's'}`,
    });
  };

  const sendInvites = () => {
    setInvitesSent(true);
    setAnnouncement('Invites sent to your team.');
    toast({ severity: 'info', title: 'Invites sent', description: `${INVITEES.length} teammates invited to the workspace.` });
  };

  const announceProgress = () => {
    setAnnouncement(`${doneCount} of 5 setup tasks complete.`);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {/* Visually-hidden live region — stable mount, swappable children. */}
      <Announce politeness="polite">{announcement}</Announce>

      {bannerOpen && (
        <Banner
          severity="info"
          title="Welcome to wow-two"
          description="Finish the five setup tasks below to unlock your workspace."
          onClose={() => setBannerOpen(false)}
          className="rounded-lg"
          actions={
            <Button size="xs" variant="outline" tone="neutral" className="border-current text-current" onClick={() => setTourOpen(true)}>
              Take the tour
            </Button>
          }
        />
      )}

      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">First-run setup</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {OWNER ? (
              <>
                Workspace owned by <UserHoverCard user={OWNER} /> — hover the name for details.
              </>
            ) : (
              'Get your workspace ready in a few minutes.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2" data-tour="help">
          <Popover placement="bottom">
            <PopoverTrigger asChild>
              <Button variant="outline" tone="neutral" size="sm">
                What is a workspace?
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="text-sm font-semibold text-foreground">Workspaces</div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                A workspace groups projects, environments, and members under one billing
                account. You can create more later — settings carry over.
              </p>
              <p className="mt-2 text-xs text-subtle-foreground">
                Plans apply per workspace, not per member.
              </p>
            </PopoverContent>
          </Popover>
          <Button variant="soft" tone="neutral" size="sm" onClick={announceProgress}>
            Announce progress
          </Button>
          <Button size="sm" onClick={() => setTourOpen(true)}>
            Start tour
          </Button>
        </div>
      </div>

      {announcement && (
        <p className="text-xs text-subtle-foreground" aria-hidden="true">
          Last announcement: <span className="font-medium">{announcement}</span>
        </p>
      )}

      <Tour
        open={tourOpen}
        onOpenChange={setTourOpen}
        steps={TOUR_STEPS}
        onComplete={() => {
          setTourDone(true);
          setAnnouncement('Product tour finished.');
          toast({ severity: 'success', title: 'Tour complete', description: 'Checklist item ticked off.' });
        }}
        onSkip={() => setAnnouncement('Product tour skipped.')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left column — checklist + guidance */}
        <div className="flex flex-col gap-4">
          <div data-tour="checklist">
            <OnboardingChecklist title="Get started with wow-two">
              <OnboardingChecklistTask
                label="Take the product tour"
                description="Four quick stops around this screen."
                done={tourDone}
                action={
                  <Button size="xs" variant="soft" tone="neutral" onClick={() => setTourOpen(true)}>
                    Start
                  </Button>
                }
              />
              <OnboardingChecklistTask
                label="Create your workspace"
                description="Run the setup wizard on the right."
                done={wizardDone}
              />
              <OnboardingChecklistTask
                label="Pick a plan"
                description="Chosen in step 2 of the wizard."
                done={planChosen}
              />
              <OnboardingChecklistTask
                label="Invite your team"
                description="Select teammates in the wizard, or send to everyone."
                done={invitesSent}
                action={
                  <Button size="xs" variant="soft" tone="neutral" onClick={sendInvites}>
                    Invite all
                  </Button>
                }
              />
              <OnboardingChecklistTask
                label="Provision an environment"
                description="Use the provisioning sandbox below the wizard."
                done={provisionDone}
              />
            </OnboardingChecklist>
          </div>

          <Callout severity="info" title="Tip">
            Everything on this page is local state — refresh to reset the whole first-run
            flow and try a different path.
          </Callout>

          <Callout severity="warning" title="Plans lock after provisioning">
            Switching plans re-provisions environments. Pick the plan before starting the
            sandbox run if you want a single pass.
          </Callout>
        </div>

        {/* Right column — wizard + provisioning sandbox */}
        <div className="flex flex-col gap-4">
          <section
            data-tour="wizard"
            className="rounded-lg border border-border bg-card p-5"
            aria-label="Workspace setup wizard"
          >
            <ProgressSteps steps={WIZARD_STEP_LABELS} current={stepIndex} className="mb-5" />

            <Wizard
              defaultCurrentStep="details"
              onStepChange={(id) => {
                const i = WIZARD_STEP_IDS.indexOf(id as WizardStepId);
                if (i >= 0) setStepIndex(i);
              }}
              onComplete={completeWizard}
            >
              <WizardStep
                id="details"
                label="Details"
                validate={() => {
                  const ok = workspaceName.trim().length > 0;
                  setNameError(!ok);
                  return ok;
                }}
              >
                <LabeledInput label="Workspace name" trailing="Required">
                  <TextInput
                    placeholder="acme-prod"
                    value={workspaceName}
                    onChange={(e) => {
                      setWorkspaceName(e.target.value);
                      if (nameError && e.target.value.trim().length > 0) setNameError(false);
                    }}
                    state={nameError ? 'invalid' : 'default'}
                  />
                </LabeledInput>
                {nameError && (
                  <p className="text-xs text-destructive">Name the workspace to continue.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, digits, and dashes. Shown in URLs and CLI output.
                </p>
              </WizardStep>

              <WizardStep id="plan" label="Plan">
                <RadioGroup
                  legend="Choose a plan"
                  value={plan}
                  onValueChange={(next) => {
                    setPlan(next);
                    if (next) setAnnouncement(`${PLANS.find((p) => p.id === next)?.name ?? next} plan selected.`);
                  }}
                >
                  {PLANS.map((p) => (
                    <ChoiceCard
                      key={p.id}
                      value={p.id}
                      label={`${p.name} — ${p.priceLabel}`}
                      description={p.blurb}
                    />
                  ))}
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  You can change plans later from Billing — proration applies.
                </p>
              </WizardStep>

              <WizardStep id="team" label="Team" optional>
                <div className="text-sm font-medium text-foreground">Invite teammates</div>
                <ul className="flex flex-col gap-2">
                  {INVITEES.map((u) => {
                    const selected = selectedInvitees.includes(u.id);
                    return (
                      <li
                        key={u.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
                            {u.initials}
                          </span>
                          <div className="min-w-0">
                            <UserHoverCard user={u} />
                            <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                        <Button
                          size="xs"
                          variant={selected ? 'soft' : 'outline'}
                          tone={selected ? 'primary' : 'neutral'}
                          aria-pressed={selected}
                          onClick={() => toggleInvitee(u.id)}
                        >
                          {selected ? 'Selected' : 'Select'}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {selectedInvitees.length} selected — invites go out when setup finishes.
                </p>
              </WizardStep>

              <WizardStep id="review" label="Review" final>
                <div className="rounded-md border border-border bg-background p-4">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Workspace</dt>
                    <dd className="font-medium text-foreground">{workspaceName.trim() || '—'}</dd>
                    <dt className="text-muted-foreground">Plan</dt>
                    <dd className="font-medium text-foreground">
                      {selectedPlan ? `${selectedPlan.name} (${selectedPlan.priceLabel})` : 'None selected'}
                    </dd>
                    <dt className="text-muted-foreground">Invites</dt>
                    <dd className="font-medium text-foreground">
                      {selectedInvitees.length === 0 ? 'None' : `${selectedInvitees.length} teammate${selectedInvitees.length === 1 ? '' : 's'}`}
                    </dd>
                  </dl>
                </div>
                {!planChosen && (
                  <Callout severity="neutral">
                    No plan picked — the workspace starts on Starter until you choose one.
                  </Callout>
                )}
              </WizardStep>

              <WizardFooter submitLabel="Finish setup" />
            </Wizard>
          </section>

          {/* Provisioning sandbox — LoadingOverlay demo (inline, toggleable) */}
          <section
            data-tour="provisioning"
            aria-label="Provisioning sandbox"
            className="relative overflow-hidden rounded-lg border border-border bg-card p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Provisioning sandbox</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Spins up a fake <span className="font-medium">staging-eu-1</span> environment;
                  the overlay blocks this card while the run is in flight.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {provisionDone && !provisioning && (
                  <span className="text-xs font-medium text-success">Provisioned</span>
                )}
                <Button
                  size="sm"
                  variant={provisionDone ? 'outline' : 'solid'}
                  tone={provisionDone ? 'neutral' : 'primary'}
                  onClick={() => setProvisioning(true)}
                  isDisabled={provisioning}
                >
                  {provisionDone ? 'Re-provision' : 'Start provisioning'}
                </Button>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <li className="rounded-md border border-border bg-background px-3 py-2">
                Region <span className="block font-medium text-foreground">eu-central</span>
              </li>
              <li className="rounded-md border border-border bg-background px-3 py-2">
                Runtime <span className="block font-medium text-foreground">node 22 LTS</span>
              </li>
              <li className="rounded-md border border-border bg-background px-3 py-2">
                Database <span className="block font-medium text-foreground">postgres 17</span>
              </li>
            </ul>
            <LoadingOverlay open={provisioning} inline blur label="Provisioning staging-eu-1…" />
          </section>
        </div>
      </div>
    </div>
  );
}
