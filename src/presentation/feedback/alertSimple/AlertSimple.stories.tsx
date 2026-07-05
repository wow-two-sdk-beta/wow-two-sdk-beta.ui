import type { Meta, StoryObj } from '@storybook/react';
import { AlertSimple } from './AlertSimple';

const meta: Meta<typeof AlertSimple> = {
  title: 'Feedback/AlertSimple',
  component: AlertSimple,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AlertSimple>;

export const Severities: Story = {
  render: () => (
    <div className="space-y-3">
      {(['info', 'success', 'warning', 'danger', 'neutral'] as const).map((s) => (
        <AlertSimple key={s} severity={s}>
          <strong className="capitalize">{s}.</strong> The deploy completed at 10:42.
        </AlertSimple>
      ))}
    </div>
  ),
};
