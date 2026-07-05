import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useRef, useState } from 'react';
import { MessageList, type MessageListHandle } from './MessageList';
import { ChatBubble } from '../chatBubble/ChatBubble';
import { Avatar } from '../avatar/Avatar';
import { TypingIndicator } from '../../feedback/typingIndicator/TypingIndicator';

const meta: Meta<typeof MessageList> = {
  title: 'Display/MessageList',
  component: MessageList,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MessageList>;

export const Conversation: Story = {
  render: () => (
    <div className="h-[420px] w-[480px] rounded-md border border-border bg-card">
      <MessageList footer={<TypingIndicator who="Alex" />}>
        <MessageList.DaySeparator label="Yesterday" />
        <ChatBubble
          side="start"
          avatar={<Avatar name="Alex Park" size="sm" />}
          author="Alex"
          timestamp="3:21 PM"
        >
          Push the migration to staging when you can.
        </ChatBubble>
        <ChatBubble side="end" status="read" timestamp="3:25 PM">
          Done — running smoke now.
        </ChatBubble>
        <MessageList.DaySeparator label="Today" />
        <ChatBubble tone="system">Alex joined the channel</ChatBubble>
        <ChatBubble
          side="start"
          avatar={<Avatar name="Alex Park" size="sm" />}
          author="Alex"
          timestamp="9:41 AM"
        >
          Smoke green?
        </ChatBubble>
        <ChatBubble side="end" status="read" timestamp="9:42 AM">
          All green.
        </ChatBubble>
      </MessageList>
    </div>
  ),
};

function StreamingDemo() {
  const [count, setCount] = useState(3);
  const ref = useRef<MessageListHandle | null>(null);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + 1), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="h-[360px] w-[420px] rounded-md border border-border bg-card">
      <MessageList ref={ref}>
        {Array.from({ length: count }).map((_, i) => (
          <ChatBubble
            key={i}
            side={i % 2 ? 'end' : 'start'}
            status={i % 2 ? 'read' : undefined}
            timestamp={`${9 + Math.floor(i / 2)}:${(i * 7) % 60}`.padEnd(7, '0')}
          >
            Message {i + 1} — content streams in over time.
          </ChatBubble>
        ))}
      </MessageList>
    </div>
  );
}

export const StreamingMessages: Story = { render: () => <StreamingDemo /> };

export const Empty: Story = {
  render: () => (
    <div className="h-[280px] w-[420px] rounded-md border border-border bg-card">
      <MessageList>
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          No messages yet — say hi 👋
        </div>
      </MessageList>
    </div>
  ),
};
