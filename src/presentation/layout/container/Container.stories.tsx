import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './Container';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Container>;

export const Default: Story = {
  args: {
    size: 'lg',
    className: 'bg-neutral-100 py-6',
    children: 'Container content',
  },
};
