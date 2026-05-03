import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from './DropdownMenu';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Nav/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DropdownMenu>;

export const Default: Story = {
  render: () => (
    <div className="p-12">
      <DropdownMenu>
        <DropdownMenu.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Options
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item onSelect={() => alert('Profile')}>Profile</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={() => alert('Settings')}>Settings</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item state="destructive" onSelect={() => alert('Logout')}>
            Logout
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  ),
};

export const Grouped: Story = {
  render: () => (
    <div className="p-12">
      <DropdownMenu>
        <DropdownMenu.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Account
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Label>My account</DropdownMenu.Label>
          <DropdownMenu.Item>Profile</DropdownMenu.Item>
          <DropdownMenu.Item>Billing</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Group label="Team">
            <DropdownMenu.Item>Invite</DropdownMenu.Item>
            <DropdownMenu.Item>Members</DropdownMenu.Item>
          </DropdownMenu.Group>
          <DropdownMenu.Separator />
          <DropdownMenu.Item state="destructive">Logout</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  ),
};
