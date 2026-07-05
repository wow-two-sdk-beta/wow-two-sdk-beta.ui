import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ReactionBar, type Reaction } from './ReactionBar';

const meta: Meta<typeof ReactionBar> = {
  title: 'Display/ReactionBar',
  component: ReactionBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ReactionBar>;

const initial: Reaction[] = [
  { key: '👍', emoji: '👍', count: 5, users: ['Alex', 'Jordan', 'Sam', 'Riley', 'Pat'] },
  { key: '❤️', emoji: '❤️', count: 3, isReactedByMe: true, users: ['You', 'Alex', 'Jamie'] },
  { key: '🎉', emoji: '🎉', count: 1 },
  { key: '🚀', emoji: '🚀', count: 0 },
];

export const Default: Story = { args: { reactions: initial } };

export const Compact: Story = { args: { reactions: initial, isCompact: true } };

export const NoAddButton: Story = {
  args: { reactions: initial, hasAddButton: false },
};

export const ShowEmpty: Story = {
  args: { reactions: initial, hasEmpty: true },
};

function InteractiveDemo() {
  const [list, setList] = useState<Reaction[]>(initial);
  return (
    <ReactionBar
      reactions={list}
      onReact={(key) =>
        setList((prev) =>
          prev.map((r) =>
            r.key === key
              ? {
                  ...r,
                  isReactedByMe: !r.isReactedByMe,
                  count: r.count + (r.isReactedByMe ? -1 : 1),
                }
              : r,
          ),
        )
      }
      onAdd={() => alert('Open reaction picker')}
    />
  );
}

export const Interactive: Story = { render: () => <InteractiveDemo /> };
