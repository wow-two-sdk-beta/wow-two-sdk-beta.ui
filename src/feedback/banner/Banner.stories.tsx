import type { Meta, StoryObj } from '@storybook/react';
import { Megaphone } from 'lucide-react';
import { Icon } from '../../icons';
import { Banner } from './Banner';

const meta: Meta<typeof Banner> = {
  title: 'Feedback/Banner',
  component: Banner,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  args: {
    severity: 'info',
    icon: <Icon icon={Megaphone} size={16} />,
    title: 'Maintenance window',
    description: 'Tonight 02:00–04:00 UTC. Expect brief downtime.',
    onClose: () => console.log('dismissed'),
  },
};
