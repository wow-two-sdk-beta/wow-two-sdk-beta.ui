import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../avatar/Avatar';
import { CountBadge } from '../countBadge/CountBadge';
import { NotificationDot } from '../notificationDot/NotificationDot';
import { BadgeOverlay } from './BadgeOverlay';

const meta: Meta<typeof BadgeOverlay> = {
  title: 'Display/BadgeOverlay',
  component: BadgeOverlay,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BadgeOverlay>;

export const WithCount: Story = {
  render: () => (
    <BadgeOverlay badge={<CountBadge value={5} />}>
      <Avatar name="Sam Person" />
    </BadgeOverlay>
  ),
};

export const WithDot: Story = {
  render: () => (
    <BadgeOverlay badge={<NotificationDot tone="success" />}>
      <Avatar name="Alex Lee" />
    </BadgeOverlay>
  ),
};
