import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

const meta: Meta<typeof AnimatedNumber> = {
  title: 'Display/AnimatedNumber',
  component: AnimatedNumber,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AnimatedNumber>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [v, setV] = useState(100);
      return (
        <div className="space-y-3">
          <AnimatedNumber value={v} as="div" className="text-4xl font-bold" />
          <div className="flex gap-2">
            {[10, 100, 500, 1234, 99999].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setV(n)}
                className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
              >
                Set to {n}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return <Demo />;
  },
};
