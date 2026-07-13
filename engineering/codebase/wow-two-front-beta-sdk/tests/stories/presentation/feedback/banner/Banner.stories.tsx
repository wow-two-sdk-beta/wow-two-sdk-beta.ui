import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Megaphone } from 'lucide-react';
import { Icon } from '@src/foundation/icons';
import { Banner } from '@src/presentation/feedback/banner/Banner';

const meta: Meta<typeof Banner> = {
  title: 'Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  args: {
    severity: 'info',
    icon: <Icon icon={Megaphone} size={16} />,
    title: 'Maintenance window',
    description: 'Tonight 02:00–04:00 UTC. Expect brief downtime.',
    onClose: () => console.log('dismissed'),
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — dismissal wiring + live-region role semantics.
 * Banner is stateless: `onClose` only notifies, removal is the consumer's
 * job, so the dismiss story wires a stateful demo the way an app would.
 * ------------------------------------------------------------------------- */

type BannerPlayArgs = { onClose: ReturnType<typeof fn> };
type PlayStory = StoryObj<BannerPlayArgs>;

export const DismissFiresOnCloseAndRemoves: PlayStory = {
  args: { onClose: fn() },
  render: (args) => {
    function Demo() {
      const [visible, setVisible] = useState(true);
      if (!visible) return <p>Banner dismissed.</p>;
      return (
        <div className="w-[36rem]">
          <Banner
            severity="info"
            title="Maintenance window"
            description="Tonight 02:00–04:00 UTC."
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

    const banner = canvas.getByRole('status');
    await expect(banner).toHaveTextContent('Maintenance window');

    await userEvent.click(within(banner).getByRole('button', { name: 'Dismiss' }));

    await expect(args.onClose).toHaveBeenCalledTimes(1);
    await expect(canvas.queryByRole('status')).not.toBeInTheDocument();
    await expect(canvas.getByText('Banner dismissed.')).toBeInTheDocument();
  },
};

export const RoleSemanticsStatusVsAlert: Story = {
  render: () => (
    <div className="w-[36rem] space-y-3">
      <Banner severity="info" title="Passive notice" description="Announced politely by default." />
      <Banner
        role="alert"
        severity="danger"
        title="Service outage"
        description="Escalated to an assertive live region via the role override."
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Default is a polite status region; `role` passes through for urgency.
    await expect(canvas.getByRole('status')).toHaveTextContent('Passive notice');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Service outage');
  },
};
