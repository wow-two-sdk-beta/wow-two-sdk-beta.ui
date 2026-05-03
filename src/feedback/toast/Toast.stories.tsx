import type { Meta, StoryObj } from '@storybook/react';
import { Check } from 'lucide-react';
import { Icon } from '../../icons';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: {
    icon: <Icon icon={Check} size={16} className="text-success" />,
    title: 'Saved',
    description: 'Your changes are live.',
    onClose: () => {},
  },
  render: (args) => <div className="w-80"><Toast {...args} /></div>,
};
