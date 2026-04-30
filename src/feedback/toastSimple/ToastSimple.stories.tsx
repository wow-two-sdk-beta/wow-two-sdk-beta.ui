import type { Meta, StoryObj } from '@storybook/react';
import { ToastSimple } from './ToastSimple';

const meta: Meta<typeof ToastSimple> = {
  title: 'Feedback/ToastSimple',
  component: ToastSimple,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ToastSimple>;

export const Default: Story = {
  args: { className: 'w-80', children: 'Saved.' },
};
