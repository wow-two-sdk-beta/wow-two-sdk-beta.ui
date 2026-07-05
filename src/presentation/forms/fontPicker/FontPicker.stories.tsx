import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FontPicker } from './FontPicker';

const meta: Meta<typeof FontPicker> = {
  title: 'Forms/FontPicker',
  component: FontPicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof FontPicker>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [family, setFamily] = useState<string>(
        'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      );
      return (
        <div className="space-y-3">
          <FontPicker value={family} onValueChange={setFamily} />
          <p style={{ fontFamily: family }} className="text-2xl">
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      );
    }
    return <Demo />;
  },
};
