import type { Meta, StoryObj } from '@storybook/react';
import { Inbox } from 'lucide-react';
import { Icon } from '../../icons';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Display/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <Icon icon={Inbox} size={28} />,
    title: 'Nothing here yet',
    description: 'New listings will appear here as soon as they arrive.',
  },
};
