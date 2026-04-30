import type { Meta, StoryObj } from '@storybook/react';
import { HStack } from './HStack';

const meta: Meta<typeof HStack> = {
  title: 'Layout/HStack',
  component: HStack,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof HStack>;

export const Default: Story = {
  render: () => (
    <HStack gap="3">
      {['A', 'B', 'C'].map((t) => (
        <div key={t} className="rounded-md bg-neutral-100 px-3 py-2">{t}</div>
      ))}
    </HStack>
  ),
};
