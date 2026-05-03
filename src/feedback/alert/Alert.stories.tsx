import type { Meta, StoryObj } from '@storybook/react';
import { CheckCircle2, Info as InfoIcon } from 'lucide-react';
import { Icon } from '../../icons';
import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Feedback/Alert',
  component: Alert,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    severity: 'info',
    icon: <Icon icon={InfoIcon} size={18} />,
    title: 'Heads up',
    description: 'A new release is available — refresh to update.',
    onClose: () => console.log('dismissed'),
  },
  render: (args) => <div className="w-[28rem]"><Alert {...args} /></div>,
};

export const Success: Story = {
  args: {
    severity: 'success',
    icon: <Icon icon={CheckCircle2} size={18} />,
    title: 'Saved',
    description: 'Your changes have been persisted.',
  },
  render: (args) => <div className="w-[28rem]"><Alert {...args} /></div>,
};
