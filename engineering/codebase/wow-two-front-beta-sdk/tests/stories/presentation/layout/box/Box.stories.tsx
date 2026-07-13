import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@src/presentation/layout/box/Box';

const meta: Meta<typeof Box> = {
  title: 'Layout/Box',
  component: Box,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: { className: 'p-4 bg-neutral-100 rounded-md', children: 'Box' },
};
export const AsSection: Story = {
  args: { as: 'section', className: 'p-4 bg-neutral-100 rounded-md', children: 'Section' },
};
