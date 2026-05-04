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
  { key: '❤️', emoji: '❤️', count: 3, reactedByMe: true, users: ['You', 'Alex', 'Jamie'] },
  { key: '🎉', emoji: '🎉', count: 1 },
  { key: '🚀', emoji: '🚀', count: 0 },
];

export const Default: Story = { args: { reactions: initial } };

export const Compact: Story = { args: { reactions: initial, compact: true } };

export const NoAddButton: Story = {
  args: { reactions: initial, hideAddButton: true },
};

export const ShowEmpty: Story = {
  args: { reactions: initial, hideEmpty: false },
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
                  reactedByMe: !r.reactedByMe,
                  count: r.count + (r.reactedByMe ? -1 : 1),
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
