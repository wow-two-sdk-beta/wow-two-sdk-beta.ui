import type { Meta, StoryObj } from '@storybook/react';
import { PresenceIndicator } from './PresenceIndicator';
import { Avatar } from '../../display/avatar/Avatar';

const meta: Meta<typeof PresenceIndicator> = {
  title: 'Feedback/PresenceIndicator',
  component: PresenceIndicator,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PresenceIndicator>;

export const Online: Story = { args: { status: 'online' } };
export const Idle: Story = { args: { status: 'idle' } };
export const Busy: Story = { args: { status: 'busy' } };
export const Offline: Story = { args: { status: 'offline' } };
export const Invisible: Story = { args: { status: 'invisible' } };
export const Pulsing: Story = { args: { status: 'online', pulse: true, size: 'md' } };

export const OnAvatar: Story = {
  render: (args) => (
    <span className="relative inline-flex">
      <Avatar name="Alex Park" size="lg" />
      <PresenceIndicator {...args} position="bottom-right" size="md" />
    </span>
  ),
  args: { status: 'online' },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <PresenceIndicator size="xs" />
      <PresenceIndicator size="sm" />
      <PresenceIndicator size="md" />
      <PresenceIndicator size="lg" />
    </div>
  ),
};
