import type { Meta, StoryObj } from '@storybook/react';
import { Settings } from 'lucide-react';
import { Icon } from '../../icons';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Actions/IconButton',
  component: IconButton,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {
  args: { 'aria-label': 'Settings', children: <Icon icon={Settings} size={18} /> },
};
export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['solid', 'soft', 'outline', 'ghost', 'danger'] as const).map((v) => (
        <IconButton key={v} aria-label={v} variant={v}>
          <Icon icon={Settings} size={18} />
        </IconButton>
      ))}
    </div>
  ),
};
