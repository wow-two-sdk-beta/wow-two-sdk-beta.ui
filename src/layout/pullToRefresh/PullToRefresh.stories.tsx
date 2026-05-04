import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PullToRefresh } from './PullToRefresh';

const meta: Meta<typeof PullToRefresh> = {
  title: 'Layout/PullToRefresh',
  component: PullToRefresh,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof PullToRefresh>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [items, setItems] = useState(() => Array.from({ length: 12 }, (_, i) => `Item ${i + 1}`));
      return (
        <div className="h-96 w-80 overflow-hidden rounded-md border border-border">
          <PullToRefresh
            onRefresh={async () => {
              await new Promise((r) => setTimeout(r, 1200));
              setItems((prev) => [`New ${Math.floor(Math.random() * 1000)}`, ...prev]);
            }}
          >
            <ul className="divide-y divide-border">
              {items.map((label) => (
                <li key={label} className="bg-card px-4 py-3 text-sm">
                  {label}
                </li>
              ))}
            </ul>
          </PullToRefresh>
        </div>
      );
    }
    return <Demo />;
  },
};
