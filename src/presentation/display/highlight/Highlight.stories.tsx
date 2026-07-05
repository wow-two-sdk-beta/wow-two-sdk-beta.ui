import type { Meta, StoryObj } from '@storybook/react';
import { Highlight } from './Highlight';

const meta: Meta<typeof Highlight> = {
  title: 'Display/Highlight',
  component: Highlight,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Highlight>;

export const Single: Story = {
  args: { children: 'The quick brown fox jumps over the lazy dog', query: 'fox' },
};
export const Multiple: Story = {
  args: {
    children: 'React + TypeScript + Tailwind = wow-two stack',
    query: ['React', 'Tailwind'],
  },
};
