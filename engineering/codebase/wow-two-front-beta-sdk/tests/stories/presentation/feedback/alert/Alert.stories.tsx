import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckCircle2, Info as InfoIcon } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { Alert } from '@src/presentation/feedback/alert/Alert';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    severity: 'info',
    icon: <Icon icon={InfoIcon} size={18} />,
    title: 'Heads up',
    description: 'A new release is available — refresh to update.',
    onClose: () => console.log('dismissed'),
  },
  render: (args) => <div className="w-[28rem]"><Alert {...args} /></div>,
};

export const Success: Story = {
  args: {
    severity: 'success',
    icon: <Icon icon={CheckCircle2} size={18} />,
    title: 'Saved',
    description: 'Your changes have been persisted.',
  },
  render: (args) => <div className="w-[28rem]"><Alert {...args} /></div>,
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — dismissal wiring + live-region role semantics.
 * Alert is stateless: `onClose` only notifies, removal is the consumer's job,
 * so the dismiss story wires a stateful demo the way an app would.
 * ------------------------------------------------------------------------- */

type AlertPlayArgs = { onClose: ReturnType<typeof fn> };
type PlayStory = StoryObj<AlertPlayArgs>;

export const DismissFiresOnCloseAndRemoves: PlayStory = {
  args: { onClose: fn() },
  render: (args) => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      if (!visible) return <p>Alert dismissed.</p>;
      return (
        <div className="w-[28rem]">
          <Alert
            severity="info"
            title="Heads up"
            description="A new release is available."
            onClose={() => {
              args.onClose();
              setVisible(false);
            }}
          />
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    const alert = canvas.getByRole('status');
    await expect(alert).toHaveTextContent('Heads up');

    await userEvent.click(within(alert).getByRole('button', { name: 'Dismiss' }));

    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.getByText('Alert dismissed.')).toBeInTheDocument();
  },
};

export const RoleSemanticsStatusVsAlert: Story = {
  render: () => (
    <div className="w-[28rem] space-y-3">
      <Alert severity="info" title="Passive update" description="Announced politely by default." />
      <Alert
        role="alert"
        severity="danger"
        title="Payment failed"
        description="Escalated to an assertive live region via the role override."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default is a polite status region; `role` passes through for urgency.
    await expect(canvas.getByRole('status')).toHaveTextContent('Passive update');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Payment failed');
  },
};
