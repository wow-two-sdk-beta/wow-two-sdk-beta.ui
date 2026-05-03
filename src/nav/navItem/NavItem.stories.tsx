import type { Meta, StoryObj } from '@storybook/react';
import { Inbox, Settings, Users } from 'lucide-react';
import { Icon } from '../../icons';
import { NavItem } from './NavItem';

const meta: Meta<typeof NavItem> = {
  title: 'Nav/NavItem',
  component: NavItem,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof NavItem>;

export const Sidebar: Story = {
  render: () => (
    <nav className="w-56 space-y-1 rounded-md border border-border p-2">
      <NavItem href="#" icon={<Icon icon={Inbox} size={16} />} isActive trailing={<span className="text-xs">12</span>}>
        Inbox
      </NavItem>
      <NavItem href="#" icon={<Icon icon={Users} size={16} />}>
        Contacts
      </NavItem>
      <NavItem href="#" icon={<Icon icon={Settings} size={16} />}>
        Settings
      </NavItem>
    </nav>
  ),
};
