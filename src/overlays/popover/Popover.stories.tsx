import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from './Popover';

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <div className="p-12">
      <Popover>
        <Popover.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Open popover
        </Popover.Trigger>
        <Popover.Content>
          <h3 className="mb-2 text-sm font-semibold">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Adjust user preferences here. Click outside to close.
          </p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const TopPlacement: Story = {
  render: () => (
    <div className="p-32">
      <Popover placement="top">
        <Popover.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Top
        </Popover.Trigger>
        <Popover.Content>Anchored above the trigger.</Popover.Content>
      </Popover>
    </div>
  ),
};
