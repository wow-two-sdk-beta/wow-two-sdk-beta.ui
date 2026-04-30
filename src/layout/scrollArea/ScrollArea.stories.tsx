import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  title: 'Layout/ScrollArea',
  component: ScrollArea,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-40 w-64 rounded-md border border-neutral-200 p-4">
      {Array.from({ length: 30 }, (_, i) => (
        <p key={i}>Line {i + 1}</p>
      ))}
    </ScrollArea>
  ),
};
