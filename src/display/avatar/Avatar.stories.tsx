import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Display/Avatar',
  component: Avatar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Image: Story = {
  args: { src: 'https://i.pravatar.cc/120?img=12', name: 'Sam Person' },
};
export const Initials: Story = { args: { name: 'Sam Person' } };
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((s) => (
        <Avatar key={s} name="Sam Person" size={s} />
      ))}
    </div>
  ),
};
