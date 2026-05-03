import type { Meta, StoryObj } from '@storybook/react';
import { Calendar } from 'lucide-react';
import { Icon } from '../../icons';
import { InfoRow } from './InfoRow';

const meta: Meta<typeof InfoRow> = {
  title: 'Display/InfoRow',
  component: InfoRow,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof InfoRow>;

export const Inline: Story = {
  args: { label: 'Created', value: '2026-04-01', icon: <Icon icon={Calendar} size={14} /> },
  render: (args) => <div className="w-72"><InfoRow {...args} /></div>,
};
export const Stacked: Story = {
  args: { label: 'Notes', value: 'Long-form content goes below the label.', layout: 'stacked' },
  render: (args) => <div className="w-72"><InfoRow {...args} /></div>,
};
