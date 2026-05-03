import type { Meta, StoryObj } from '@storybook/react';
import { Lightbulb } from 'lucide-react';
import { Icon } from '../../icons';
import { Callout } from './Callout';

const meta: Meta<typeof Callout> = {
  title: 'Feedback/Callout',
  component: Callout,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Callout>;

export const Tip: Story = {
  args: {
    severity: 'info',
    icon: <Icon icon={Lightbulb} size={16} />,
    title: 'Tip',
    children: 'Press ⌘K to open the command palette.',
  },
  render: (args) => <div className="w-[28rem]"><Callout {...args} /></div>,
};
