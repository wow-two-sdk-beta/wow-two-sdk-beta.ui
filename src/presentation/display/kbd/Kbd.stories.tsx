import type { Meta, StoryObj } from '@storybook/react';
import { Kbd } from './Kbd';

const meta: Meta<typeof Kbd> = {
  title: 'Display/Kbd',
  component: Kbd,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = { args: { children: 'K' } };
export const Shortcut: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
    </span>
  ),
};
