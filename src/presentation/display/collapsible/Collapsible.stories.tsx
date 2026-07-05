import type { Meta, StoryObj } from '@storybook/react';
import { Collapsible } from './Collapsible';

const meta: Meta<typeof Collapsible> = {
  title: 'Display/Collapsible',
  component: Collapsible,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        Show details
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 rounded-md border border-border bg-muted p-3 text-sm">
        Hidden content revealed. Click trigger again to collapse.
      </Collapsible.Content>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <Collapsible.Trigger className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted">
        Initially open
      </Collapsible.Trigger>
      <Collapsible.Content className="mt-2 rounded-md border border-border bg-muted p-3 text-sm">
        Pre-expanded.
      </Collapsible.Content>
    </Collapsible>
  ),
};
