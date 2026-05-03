import type { Meta, StoryObj } from '@storybook/react';
import { StatusIndicator } from './StatusIndicator';

const meta: Meta<typeof StatusIndicator> = {
  title: 'Feedback/StatusIndicator',
  component: StatusIndicator,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof StatusIndicator>;

export const Healthy: Story = {
  args: { tone: 'success', label: 'All systems normal', description: 'Updated 2 minutes ago', pulse: true },
};
export const Degraded: Story = {
  args: { tone: 'warning', label: 'Degraded performance', description: '2 services affected' },
};
