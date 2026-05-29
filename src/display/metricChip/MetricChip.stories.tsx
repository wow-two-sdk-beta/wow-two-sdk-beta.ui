import type { Meta, StoryObj } from '@storybook/react';
import { Activity, Clock, DollarSign, Zap } from 'lucide-react';
import { Icon } from '../../icons';
import { MetricChip } from './MetricChip';

const meta: Meta<typeof MetricChip> = {
  title: 'Display/MetricChip',
  component: MetricChip,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof MetricChip>;

export const Default: Story = {
  args: { label: 'Segs', value: '128', icon: <Icon icon={Activity} size={12} /> },
};

export const Strip: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <MetricChip icon={<Icon icon={Activity} size={12} />} label="Segs" value="128" />
      <MetricChip icon={<Icon icon={Clock} size={12} />} label="Took" value="1.4s" tone="info" />
      <MetricChip icon={<Icon icon={DollarSign} size={12} />} label="Cost" value="$0.042" tone="success" />
      <MetricChip icon={<Icon icon={Zap} size={12} />} label="Spike" value="3" tone="warning" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <MetricChip size="xs" icon={<Icon icon={Activity} size={10} />} label="Segs" value="128" />
      <MetricChip size="sm" icon={<Icon icon={Activity} size={12} />} label="Segs" value="128" />
      <MetricChip size="md" icon={<Icon icon={Activity} size={14} />} label="Segs" value="128" />
    </div>
  ),
};
