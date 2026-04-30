import type { Meta, StoryObj } from '@storybook/react';
import { ProgressCircle } from './ProgressCircle';

const meta: Meta<typeof ProgressCircle> = {
  title: 'Feedback/ProgressCircle',
  component: ProgressCircle,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressCircle>;

export const Determinate: Story = { args: { value: 70, size: 64 } };
export const Indeterminate: Story = { args: { size: 64 } };
