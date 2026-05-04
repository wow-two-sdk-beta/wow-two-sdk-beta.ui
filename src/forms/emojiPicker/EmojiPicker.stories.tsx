import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmojiPicker } from './EmojiPicker';

const meta: Meta<typeof EmojiPicker> = {
  title: 'Forms/EmojiPicker',
  component: EmojiPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmojiPicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [last, setLast] = useState<string>('');
      return (
        <div className="space-y-3">
          <EmojiPicker onSelect={setLast} />
          {last && (
            <p className="text-sm text-muted-foreground">
              You picked: <span className="text-2xl">{last}</span>
            </p>
          )}
        </div>
      );
    }
    return <Demo />;
  },
};
