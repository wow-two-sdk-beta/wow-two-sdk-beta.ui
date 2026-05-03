import type { Meta, StoryObj } from '@storybook/react';
import { ProgressSteps } from './ProgressSteps';

const meta: Meta<typeof ProgressSteps> = {
  title: 'Feedback/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressSteps>;

export const Horizontal: Story = {
  args: { steps: ['Account', 'Profile', 'Verify', 'Done'], current: 2 },
  render: (args) => <div className="w-[40rem]"><ProgressSteps {...args} /></div>,
};
export const Vertical: Story = {
  args: { steps: ['Account', 'Profile', 'Verify', 'Done'], current: 2, orientation: 'vertical' },
};
