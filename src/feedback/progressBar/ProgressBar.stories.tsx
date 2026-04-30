import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from './ProgressBar';

const meta: Meta<typeof ProgressBar> = {
  title: 'Feedback/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Determinate: Story = { args: { value: 60 } };
export const Indeterminate: Story = { args: {} };
export const Tones: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      {(['brand', 'success', 'warning', 'danger', 'neutral'] as const).map((t) => (
        <ProgressBar key={t} tone={t} value={40} />
      ))}
    </div>
  ),
};
