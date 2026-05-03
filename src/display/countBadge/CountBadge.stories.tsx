import type { Meta, StoryObj } from '@storybook/react';
import { CountBadge } from './CountBadge';

const meta: Meta<typeof CountBadge> = {
  title: 'Display/CountBadge',
  component: CountBadge,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CountBadge>;

export const Default: Story = { args: { value: 12 } };
export const Capped: Story = { args: { value: 250, max: 99 } };
export const Hidden: Story = { args: { value: 0 } };
