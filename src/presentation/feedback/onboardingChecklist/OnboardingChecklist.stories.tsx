import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { OnboardingChecklist, OnboardingChecklistTask } from './OnboardingChecklist';

const meta: Meta = {
  title: 'Feedback/OnboardingChecklist',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [done, setDone] = useState({ profile: true, invite: false, integration: false });
      const action = (key: keyof typeof done) => (
        <button
          type="button"
          onClick={() => setDone((d) => ({ ...d, [key]: true }))}
          className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Do it
        </button>
      );
      return (
        <div className="w-[28rem]">
          <OnboardingChecklist title="Set up your workspace" canDismissOnComplete>
            <OnboardingChecklistTask
              label="Complete profile"
              description="Add a name, avatar, and bio."
              isDone={done.profile}
              action={action('profile')}
            />
            <OnboardingChecklistTask
              label="Invite teammates"
              description="Send invite links to up to 5 teammates."
              isDone={done.invite}
              action={action('invite')}
            />
            <OnboardingChecklistTask
              label="Connect an integration"
              description="Link Slack, GitHub, or Jira."
              isDone={done.integration}
              action={action('integration')}
            />
          </OnboardingChecklist>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — progress derives from the tasks' `isDone` props,
 * so completion is wired through a stateful demo (action click flips state).
 * ------------------------------------------------------------------------- */

type PlayArgs = {
  onTaskDone: ReturnType<typeof fn>;
  onDismiss: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<PlayArgs>;

export const TaskActionsAdvanceProgress: PlayStory = {
  args: { onTaskDone: fn(), onDismiss: fn() },
  render: (args) => {
    function Demo() {
      const [done, setDone] = useState({ profile: true, invite: false, integration: false });
      const action = (key: keyof typeof done, label: string) => (
        <button
          type="button"
          onClick={() => {
            args.onTaskDone(key);
            setDone((d) => ({ ...d, [key]: true }));
          }}
          className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {label}
        </button>
      );
      return (
        <div className="w-[28rem]">
          <OnboardingChecklist title="Set up your workspace">
            <OnboardingChecklistTask
              label="Complete profile"
              isDone={done.profile}
              action={action('profile', 'Fill profile')}
            />
            <OnboardingChecklistTask
              label="Invite teammates"
              isDone={done.invite}
              action={action('invite', 'Send invites')}
            />
            <OnboardingChecklistTask
              label="Connect an integration"
              isDone={done.integration}
              action={action('integration', 'Connect now')}
            />
          </OnboardingChecklist>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('1 of 3 tasks complete')).toBeInTheDocument();

    // Completing a task updates the derived progress and marks the row done.
    await userEvent.click(canvas.getByRole('button', { name: 'Send invites' }));
    await expect(args.onTaskDone).toHaveBeenCalledWith('invite');
    await expect(canvas.getByText('2 of 3 tasks complete')).toBeInTheDocument();
    const inviteRow = canvas.getByText('Invite teammates').closest('li');
    await expect(inviteRow).toHaveAttribute('data-done');
    // The action affordance disappears once its task is done.
    await expect(canvas.queryByRole('button', { name: 'Send invites' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Connect now' }));
    await expect(canvas.getByText('3 of 3 tasks complete')).toBeInTheDocument();
    await expect(args.onTaskDone).toHaveBeenCalledTimes(2);
  },
};

export const AutoDismissesWhenAllComplete: PlayStory = {
  args: { onTaskDone: fn(), onDismiss: fn() },
  render: (args) => {
    function Demo() {
      const [connected, setConnected] = useState(false);
      return (
        <div className="w-[28rem]">
          <OnboardingChecklist
            title="Finish setup"
            canDismissOnComplete
            dismissDelay={400}
            onDismiss={args.onDismiss}
          >
            <OnboardingChecklistTask label="Complete profile" isDone />
            <OnboardingChecklistTask
              label="Connect an integration"
              isDone={connected}
              action={
                <button
                  type="button"
                  onClick={() => setConnected(true)}
                  className="inline-flex h-7 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Connect now
                </button>
              }
            />
          </OnboardingChecklist>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('1 of 2 tasks complete')).toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Connect now' }));
    await expect(canvas.getByText('2 of 2 tasks complete')).toBeInTheDocument();

    // After `dismissDelay`, the card unmounts and reports the dismissal.
    await waitFor(() => expect(args.onDismiss).toHaveBeenCalledTimes(1), { timeout: 1500 });
    await waitFor(() => expect(canvas.queryByText('Finish setup')).not.toBeInTheDocument());
  },
};

export const HeaderTogglesTaskList: Story = {
  render: () => (
    <div className="w-[28rem]">
      <OnboardingChecklist title="Get started">
        <OnboardingChecklistTask label="Complete profile" isDone />
        <OnboardingChecklistTask label="Invite teammates" />
      </OnboardingChecklist>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const header = canvas.getByRole('button', { name: /Get started/ });
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('list')).toBeInTheDocument();

    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.queryByRole('list')).not.toBeInTheDocument();

    await userEvent.click(header);
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('list')).toBeInTheDocument();
  },
};
