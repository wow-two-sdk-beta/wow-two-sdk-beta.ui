import type { Meta, StoryObj } from '@storybook/react';
import { TrendIndicator } from './TrendIndicator';

const meta: Meta<typeof TrendIndicator> = {
  title: 'Feedback/TrendIndicator',
  component: TrendIndicator,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TrendIndicator>;

export const Up: Story = { args: { value: 12, label: 'vs last week' } };
export const Down: Story = { args: { value: -3.4, label: 'mo/mo' } };
export const Inverse: Story = { args: { value: 5.2, inverse: true, label: 'churn' } };
export const Flat: Story = { args: { value: 0 } };
