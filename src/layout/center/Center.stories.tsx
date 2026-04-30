import type { Meta, StoryObj } from '@storybook/react';
import { Center } from './Center';

const meta: Meta<typeof Center> = {
  title: 'Layout/Center',
  component: Center,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Center>;

export const Default: Story = {
  args: {
    className: 'h-32 w-64 bg-neutral-100',
    children: 'Centered',
  },
};
