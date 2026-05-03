import type { Meta, StoryObj } from '@storybook/react';
import { MeterBar } from './MeterBar';

const meta: Meta<typeof MeterBar> = {
  title: 'Feedback/MeterBar',
  component: MeterBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MeterBar>;

export const Good: Story = { args: { value: 30 } };
export const Warning: Story = { args: { value: 80 } };
export const Critical: Story = { args: { value: 95 } };
