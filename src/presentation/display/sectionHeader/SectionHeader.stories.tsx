import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeader } from './SectionHeader';

const meta: Meta<typeof SectionHeader> = {
  title: 'Display/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {
  args: {
    title: 'Listings',
    description: 'All open listings across active channels.',
    actions: (
      <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        New listing
      </button>
    ),
  },
  render: (args) => <div className="w-[36rem]"><SectionHeader {...args} /></div>,
};
