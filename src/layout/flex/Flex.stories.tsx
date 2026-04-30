import type { Meta, StoryObj } from '@storybook/react';
import { Flex } from './Flex';

const meta: Meta<typeof Flex> = {
  title: 'Layout/Flex',
  component: Flex,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Flex>;

export const Default: Story = {
  args: {
    className: 'gap-4 items-center justify-between bg-neutral-100 p-4',
    children: <><span>Left</span><span>Right</span></>,
  },
};
