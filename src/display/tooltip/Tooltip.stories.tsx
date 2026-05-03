import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Display/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Save your changes">
      <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Save
      </button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Tooltip content="More options" placement="bottom">
      <button className="rounded-md border border-border px-3 py-1.5 text-sm">···</button>
    </Tooltip>
  ),
};
