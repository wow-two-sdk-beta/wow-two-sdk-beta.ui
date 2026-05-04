import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ReactionPicker } from './ReactionPicker';

const meta: Meta<typeof ReactionPicker> = {
  title: 'Forms/ReactionPicker',
  component: ReactionPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ReactionPicker>;

export const Default: Story = {};

export const Compact: Story = { args: { size: 'sm' } };

export const Custom: Story = {
  args: { emojis: ['🐛', '✅', '❓', '🔥', '🤝'] },
};

export const NoMore: Story = { args: { hideMore: true } };

function InteractiveDemo() {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className="flex flex-col gap-3">
      <ReactionPicker
        selected={picked}
        onSelect={(e) =>
          setPicked((prev) =>
            prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e],
          )
        }
        onMore={() => alert('Open full emoji picker')}
      />
      <p className="text-xs text-muted-foreground">
        Selected: {picked.length === 0 ? '(none)' : picked.join(' ')}
      </p>
    </div>
  );
}

export const Interactive: Story = { render: () => <InteractiveDemo /> };
