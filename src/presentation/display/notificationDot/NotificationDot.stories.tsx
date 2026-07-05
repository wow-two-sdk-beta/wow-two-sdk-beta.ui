import type { Meta, StoryObj } from '@storybook/react';
import { NotificationDot } from './NotificationDot';

const meta: Meta<typeof NotificationDot> = {
  title: 'Display/NotificationDot',
  component: NotificationDot,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NotificationDot>;

export const Inline: Story = { args: {} };

export const OverAvatar: Story = {
  render: () => (
    <div className="relative inline-block">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        SP
      </div>
      <NotificationDot position="top-right" tone="success" />
    </div>
  ),
};
