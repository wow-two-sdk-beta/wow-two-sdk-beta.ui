import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Stack>;

const items = ['Item 1', 'Item 2', 'Item 3'].map((t) => (
  <div key={t} className="rounded-md bg-neutral-100 p-3">{t}</div>
));

export const Vertical: Story = { render: () => <Stack>{items}</Stack> };
export const Horizontal: Story = {
  render: () => <Stack direction="row" gap="3">{items}</Stack>,
};
