import type { Meta, StoryObj } from '@storybook/react';
import { GitPullRequest, MessageSquare, ShieldAlert } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { Avatar } from '../../display/avatar/Avatar';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Feedback/NotificationCenter',
  component: NotificationCenter,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NotificationCenter>;

const MarkAllAction = () => (
  <button type="button" className="text-xs text-primary hover:underline">
    Mark all as read
  </button>
);

export const Default: Story = {
  render: () => (
    <NotificationCenter
      count={3}
      headerActions={<MarkAllAction />}
      footer={
        <button type="button" className="text-primary hover:underline">
          View all notifications
        </button>
      }
    >
      <NotificationCenter.Item
        unread
        icon={<Avatar name="Alex Park" size="sm" />}
        title="Alex commented on your PR"
        description="“Looks great — left two small notes inline.”"
        timestamp="2m ago"
        onSelect={() => {}}
        onDismiss={() => {}}
      />
      <NotificationCenter.Item
        unread
        icon={
          <span className="grid h-7 w-7 place-items-center rounded-full bg-success-soft text-success-soft-foreground">
            <GitPullRequest className="h-4 w-4" />
          </span>
        }
        title="PR #842 was merged"
        description="`feat: add reaction picker`"
        timestamp="14m ago"
        onSelect={() => {}}
      />
      <NotificationCenter.Item
        unread
        icon={
          <span className="grid h-7 w-7 place-items-center rounded-full bg-destructive-soft text-destructive-soft-foreground">
            <ShieldAlert className="h-4 w-4" />
          </span>
        }
        title="Build failed on main"
        description="3 tests failed in `core.di.tests`"
        timestamp="1h ago"
        onSelect={() => {}}
      />
      <NotificationCenter.Item
        icon={<Avatar name="Jordan" size="sm" />}
        title="Jordan mentioned you"
        description="“@you can you review the migration?”"
        timestamp="yesterday"
        onSelect={() => {}}
      />
      <NotificationCenter.Item
        icon={
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
            <MessageSquare className="h-4 w-4" />
          </span>
        }
        title="3 new replies in #engineering"
        timestamp="2d ago"
        onSelect={() => {}}
      />
    </NotificationCenter>
  ),
};

export const Empty: Story = {
  render: () => <NotificationCenter headerActions={<MarkAllAction />} />,
};

export const SingleUnread: Story = {
  render: () => (
    <NotificationCenter count={1}>
      <NotificationCenter.Item
        unread
        icon={<Avatar name="Sam" size="sm" />}
        title="Sam invited you to a thread"
        description="“Want to talk about the v2 dashboard?”"
        timestamp="just now"
        onSelect={() => {}}
      />
    </NotificationCenter>
  ),
};
