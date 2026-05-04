import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
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
          <OnboardingChecklist title="Set up your workspace" dismissOnComplete>
            <OnboardingChecklistTask
              label="Complete profile"
              description="Add a name, avatar, and bio."
              done={done.profile}
              action={action('profile')}
            />
            <OnboardingChecklistTask
              label="Invite teammates"
              description="Send invite links to up to 5 teammates."
              done={done.invite}
              action={action('invite')}
            />
            <OnboardingChecklistTask
              label="Connect an integration"
              description="Link Slack, GitHub, or Jira."
              done={done.integration}
              action={action('integration')}
            />
          </OnboardingChecklist>
        </div>
      );
    }
    return <Demo />;
  },
};
