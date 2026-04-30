import type { Meta, StoryObj } from '@storybook/react';
import { Mark } from './Mark';

const meta: Meta<typeof Mark> = {
  title: 'Display/Mark',
  component: Mark,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Mark>;

export const Default: Story = {
  render: () => <p>The <Mark>quick brown fox</Mark> jumps over the lazy dog.</p>,
};
