import type { Meta, StoryObj } from '@storybook/react';
import { VStack } from './VStack';

const meta: Meta<typeof VStack> = {
  title: 'Layout/VStack',
  component: VStack,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof VStack>;

export const Default: Story = {
  render: () => (
    <VStack gap="3">
      {['A', 'B', 'C'].map((t) => (
        <div key={t} className="rounded-md bg-neutral-100 px-3 py-2">{t}</div>
      ))}
    </VStack>
  ),
};
