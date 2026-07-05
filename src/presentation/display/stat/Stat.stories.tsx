import type { Meta, StoryObj } from '@storybook/react';
import { Stat } from './Stat';

const meta: Meta<typeof Stat> = {
  title: 'Display/Stat',
  component: Stat,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Stat>;

export const Up: Story = {
  args: { label: 'Active listings', value: '1,284', trend: { value: 12, label: 'vs last week' } },
};

export const Down: Story = {
  args: { label: 'Churn', value: '4.2%', trend: { value: -1.4, label: 'mo/mo' } },
};
