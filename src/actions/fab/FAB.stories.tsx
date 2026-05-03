import type { Meta, StoryObj } from '@storybook/react';
import { Plus } from 'lucide-react';
import { Icon } from '../../icons';
import { FAB } from './FAB';

const meta: Meta<typeof FAB> = {
  title: 'Actions/FAB',
  component: FAB,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj<typeof FAB>;

export const Default: Story = {
  args: {
    'aria-label': 'New item',
    children: <Icon icon={Plus} size={24} />,
  },
  render: (args) => (
    <div className="relative h-64 w-full bg-muted">
      <FAB {...args} className="!absolute" />
    </div>
  ),
};
