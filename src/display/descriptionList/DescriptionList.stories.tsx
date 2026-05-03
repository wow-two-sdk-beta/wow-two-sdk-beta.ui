import type { Meta, StoryObj } from '@storybook/react';
import { DescriptionList } from './DescriptionList';

const meta: Meta<typeof DescriptionList> = {
  title: 'Display/DescriptionList',
  component: DescriptionList,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DescriptionList>;

const items = [
  { label: 'Status', value: 'Active' },
  { label: 'Created', value: '2026-04-01' },
  { label: 'Owner', value: 'Sam Person' },
];

export const Inline: Story = { args: { items } };
export const Stacked: Story = { args: { items, layout: 'stacked' } };
