import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '../avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

const meta: Meta<typeof AvatarGroup> = {
  title: 'Display/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="Sam Person" />
      <Avatar name="Alex Lee" />
      <Avatar name="Jordan Kim" />
      <Avatar name="Riley Park" />
      <Avatar name="Casey Cho" />
    </AvatarGroup>
  ),
};
