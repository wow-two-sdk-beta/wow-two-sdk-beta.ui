import type { Meta, StoryObj } from '@storybook/react';
import { useRef } from 'react';
import { Confetti, type ConfettiHandle } from './Confetti';

const meta: Meta<typeof Confetti> = {
  title: 'Display/Confetti',
  component: Confetti,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Confetti>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const ref = useRef<ConfettiHandle>(null);
      return (
        <div>
          <button
            type="button"
            onClick={() => ref.current?.fire()}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            🎉 Fire confetti
          </button>
          <Confetti ref={ref} />
        </div>
      );
    }
    return <Demo />;
  },
};

export const WithOrigin: Story = {
  render: () => {
    function Demo() {
      const ref = useRef<ConfettiHandle>(null);
      return (
        <div>
          <button
            type="button"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              ref.current?.fire({
                origin: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
                particleCount: 100,
                spread: 90,
              });
            }}
            className="inline-flex h-9 items-center rounded-md bg-success px-4 text-sm font-medium text-success-foreground hover:opacity-90"
          >
            ✓ Burst from button
          </button>
          <Confetti ref={ref} />
        </div>
      );
    }
    return <Demo />;
  },
};
