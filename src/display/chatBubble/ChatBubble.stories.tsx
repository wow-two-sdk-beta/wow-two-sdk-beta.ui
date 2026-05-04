import type { Meta, StoryObj } from '@storybook/react';
import { ChatBubble } from './ChatBubble';
import { Avatar } from '../avatar/Avatar';
import { ReactionBar } from '../reactionBar/ReactionBar';

const meta: Meta<typeof ChatBubble> = {
  title: 'Display/ChatBubble',
  component: ChatBubble,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ChatBubble>;

export const Inbound: Story = {
  args: {
    side: 'start',
    avatar: <Avatar name="Alex Park" size="sm" />,
    author: 'Alex',
    timestamp: '9:41 AM',
    children: 'Did the export job finish? I see partial rows.',
  },
};

export const Outbound: Story = {
  args: {
    side: 'end',
    timestamp: '9:42 AM',
    status: 'read',
    children: 'Yes — finished about a minute ago. The partial was mid-flight.',
  },
};

export const Sending: Story = {
  args: { side: 'end', children: 'Pushing the fix now…', status: 'sending' },
};

export const Failed: Story = {
  args: { side: 'end', children: "Couldn't deliver this one.", status: 'failed' },
};

export const SystemNote: Story = {
  args: { tone: 'system', children: 'Alex joined the channel' },
};

export const Tailless: Story = {
  args: {
    side: 'end',
    tailless: true,
    children: 'Stacking with the message above (no tail).',
  },
};

export const WithReactions: Story = {
  args: {
    side: 'start',
    avatar: <Avatar name="Jordan" size="sm" />,
    author: 'Jordan',
    timestamp: '10:15 AM',
    children: 'Just shipped the v2 dashboard 🎉',
    footer: (
      <ReactionBar
        hideAddButton
        reactions={[
          { key: '🎉', emoji: '🎉', count: 4, reactedByMe: true },
          { key: '🚀', emoji: '🚀', count: 2 },
        ]}
      />
    ),
  },
};

export const Conversation: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-3 rounded-md border border-border bg-card p-4">
      <ChatBubble
        side="start"
        avatar={<Avatar name="Alex Park" size="sm" />}
        author="Alex"
        timestamp="9:41 AM"
      >
        Did the export job finish?
      </ChatBubble>
      <ChatBubble side="end" status="read" timestamp="9:42 AM">
        Yes, just now. Partial was mid-flight.
      </ChatBubble>
      <ChatBubble side="end" tailless status="read" timestamp="9:42 AM">
        Re-running for the missing rows.
      </ChatBubble>
      <ChatBubble tone="system">Alex left the channel</ChatBubble>
    </div>
  ),
};
