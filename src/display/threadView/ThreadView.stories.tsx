import type { Meta, StoryObj } from '@storybook/react';
import { ThreadView } from './ThreadView';
import { ChatBubble } from '../chatBubble/ChatBubble';
import { Avatar } from '../avatar/Avatar';
import { ChatComposer } from '../../forms/chatComposer/ChatComposer';
import { TypingIndicator } from '../../feedback/typingIndicator/TypingIndicator';
import { ReactionBar } from '../reactionBar/ReactionBar';

const meta: Meta<typeof ThreadView> = {
  title: 'Display/ThreadView',
  component: ThreadView,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ThreadView>;

export const Standard: Story = {
  render: () => (
    <div className="h-[520px] w-[420px]">
      <ThreadView
        subtitle="in #engineering"
        onClose={() => {}}
        parent={
          <ChatBubble
            side="start"
            avatar={<Avatar name="Alex Park" size="sm" />}
            author="Alex"
            timestamp="9:41 AM"
            footer={
              <ReactionBar
                hideAddButton
                reactions={[{ key: '👀', emoji: '👀', count: 3 }]}
              />
            }
          >
            Should we ship the v2 dashboard tomorrow?
          </ChatBubble>
        }
        composer={<ChatComposer placeholder="Reply in thread…" />}
      >
        <ChatBubble
          side="start"
          avatar={<Avatar name="Jordan" size="sm" />}
          author="Jordan"
          timestamp="9:43 AM"
        >
          QA looked clean last night.
        </ChatBubble>
        <ChatBubble side="end" status="read" timestamp="9:44 AM">
          +1, let's do it.
        </ChatBubble>
        <ChatBubble
          side="start"
          avatar={<Avatar name="Sam" size="sm" />}
          author="Sam"
          timestamp="9:45 AM"
        >
          Will the migration block?
        </ChatBubble>
        <TypingIndicator who="Alex" />
      </ThreadView>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="h-[420px] w-[420px]">
      <ThreadView
        onClose={() => {}}
        parent={
          <ChatBubble
            side="start"
            avatar={<Avatar name="Riley" size="sm" />}
            author="Riley"
            timestamp="2:10 PM"
          >
            Anyone reviewing the design tokens PR?
          </ChatBubble>
        }
        composer={<ChatComposer placeholder="Reply…" />}
      />
    </div>
  ),
};
