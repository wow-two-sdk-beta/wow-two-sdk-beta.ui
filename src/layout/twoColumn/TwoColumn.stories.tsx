import type { Meta, StoryObj } from '@storybook/react';
import { TwoColumn } from './TwoColumn';

const meta: Meta<typeof TwoColumn> = {
  title: 'Layout/TwoColumn',
  component: TwoColumn,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof TwoColumn>;

export const Default: Story = {
  render: () => (
    <TwoColumn
      aside={<div className="rounded-md border border-border bg-muted p-4">Sidebar</div>}
      className="w-[40rem]"
    >
      <div className="rounded-md border border-border p-4">Main content</div>
    </TwoColumn>
  ),
};
