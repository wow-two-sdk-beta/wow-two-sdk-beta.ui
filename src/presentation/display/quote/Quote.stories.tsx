import type { Meta, StoryObj } from '@storybook/react';
import { Quote } from './Quote';

const meta: Meta<typeof Quote> = {
  title: 'Display/Quote',
  component: Quote,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Quote>;

export const Default: Story = {
  args: {
    children: 'Make it work, make it right, make it fast. — Kent Beck',
  },
};
