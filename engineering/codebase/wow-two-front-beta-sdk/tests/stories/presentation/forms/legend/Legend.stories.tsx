import type { Meta, StoryObj } from '@storybook/react';
import { Legend } from '@src/presentation/forms/legend/Legend';

const meta: Meta<typeof Legend> = {
  title: 'Forms/Legend',
  component: Legend,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Legend>;

export const Default: Story = { args: { children: 'Group title' } };
