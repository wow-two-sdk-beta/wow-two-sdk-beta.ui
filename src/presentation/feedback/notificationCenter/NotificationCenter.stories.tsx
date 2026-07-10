import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
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
        isUnread
        icon={<Avatar name="Alex Park" size="sm" />}
        title="Alex commented on your PR"
        description="“Looks great — left two small notes inline.”"
        timestamp="2m ago"
        onSelect={() => {}}
        onDismiss={() => {}}
      />
      <NotificationCenter.Item
        isUnread
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
        isUnread
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
        isUnread
        icon={<Avatar name="Sam" size="sm" />}
        title="Sam invited you to a thread"
        description="“Want to talk about the v2 dashboard?”"
        timestamp="just now"
        onSelect={() => {}}
      />
    </NotificationCenter>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — the component is presentational (items are
 * children, count is a prop), so state flows are wired through a demo the
 * way an app would: dismiss removes the item and recomputes the unread badge.
 * No built-in clear-all / mark-all — `headerActions` is a free slot.
 * ------------------------------------------------------------------------- */

type PlayArgs = {
  onSelect: ReturnType<typeof fn>;
  onDismiss: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<PlayArgs>;

export const SelectsItemByClickAndKeyboard: PlayStory = {
  args: { onSelect: fn(), onDismiss: fn() },
  render: (args) => (
    <NotificationCenter count={1}>
      <NotificationCenter.Item
        isUnread
        title="Alex commented on your PR"
        description="Left two notes inline."
        timestamp="2m ago"
        onSelect={args.onSelect}
      />
    </NotificationCenter>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Panel semantics: a labelled region.
    await expect(canvas.getByRole('region', { name: 'Notifications' })).toBeInTheDocument();

    // Interactive rows become buttons; unread rows carry the data flag.
    const item = canvas.getByRole('button', { name: /Alex commented on your PR/ });
    await expect(item).toHaveAttribute('data-unread');

    await userEvent.click(item);
    await expect(args.onSelect).toHaveBeenCalledTimes(1);

    // Keyboard activation: Enter and Space on the focused row.
    item.focus();
    await userEvent.keyboard('{Enter}');
    await expect(args.onSelect).toHaveBeenCalledTimes(2);
    await userEvent.keyboard(' ');
    await expect(args.onSelect).toHaveBeenCalledTimes(3);
  },
};

export const DismissRemovesItemsAndUpdatesUnreadCount: PlayStory = {
  args: { onSelect: fn(), onDismiss: fn() },
  render: (args) => {
    function Demo() {
      const [items, setItems] = useState([
        { id: 'a', title: 'Build failed on main', isUnread: true },
        { id: 'b', title: 'PR #842 was merged', isUnread: true },
        { id: 'c', title: 'Jordan mentioned you', isUnread: false },
      ]);
      const unread = items.filter((i) => i.isUnread).length;
      const dismiss = (id: string) => {
        args.onDismiss(id);
        setItems((cur) => cur.filter((i) => i.id !== id));
      };
      return (
        <NotificationCenter count={unread > 0 ? unread : undefined}>
          {items.map((i) => (
            <NotificationCenter.Item
              key={i.id}
              title={i.title}
              isUnread={i.isUnread}
              onSelect={args.onSelect}
              onDismiss={() => dismiss(i.id)}
            />
          ))}
        </NotificationCenter>
      );
    }
    return <Demo />;
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Notifications' });

    await expect(within(region).getByText('2')).toBeInTheDocument();

    const dismissItem = async (name: RegExp) => {
      const item = canvas.getByRole('button', { name });
      // The dismiss affordance reveals on hover.
      await userEvent.hover(item);
      await userEvent.click(within(item).getByRole('button', { name: 'Dismiss notification' }));
    };

    await dismissItem(/Build failed on main/);
    await expect(args.onDismiss).toHaveBeenCalledWith('a');
    await expect(canvas.queryByText('Build failed on main')).not.toBeInTheDocument();
    await expect(within(region).getByText('1')).toBeInTheDocument();

    // Dismissing the last unread item drops the badge entirely.
    await dismissItem(/PR #842 was merged/);
    await expect(within(region).queryByText('1')).not.toBeInTheDocument();

    // Dismissing the final item lands on the built-in empty state.
    await dismissItem(/Jordan mentioned you/);
    await expect(args.onDismiss).toHaveBeenCalledTimes(3);
    await expect(within(region).getByText("You're all caught up.")).toBeInTheDocument();
  },
};
