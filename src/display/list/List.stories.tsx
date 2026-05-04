import type { Meta, StoryObj } from '@storybook/react';
import { Folder, Settings, Users } from 'lucide-react';
import { List } from './List';

const meta: Meta<typeof List> = {
  title: 'Display/List',
  component: List,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof List>;

export const Bulleted: Story = {
  render: () => (
    <List marker="disc" className="w-72">
      <List.Item>First item</List.Item>
      <List.Item>Second item</List.Item>
      <List.Item>Third item</List.Item>
    </List>
  ),
};

export const Ordered: Story = {
  render: () => (
    <List ordered marker="decimal" className="w-72">
      <List.Item>Step one</List.Item>
      <List.Item>Step two</List.Item>
      <List.Item>Step three</List.Item>
    </List>
  ),
};

export const Checked: Story = {
  render: () => (
    <List marker="check" spacing="loose" className="w-80">
      <List.Item showCheckMarker>Created the account</List.Item>
      <List.Item showCheckMarker>Confirmed the email</List.Item>
      <List.Item showCheckMarker>Set up profile</List.Item>
    </List>
  ),
};

export const WithSlots: Story = {
  render: () => (
    <List marker="none" spacing="loose" className="w-96">
      <List.Item leading={<Users className="h-4 w-4" />} trailing={<span>12</span>}>
        Members
      </List.Item>
      <List.Item leading={<Folder className="h-4 w-4" />} trailing={<span>4</span>}>
        Projects
      </List.Item>
      <List.Item leading={<Settings className="h-4 w-4" />}>Settings</List.Item>
    </List>
  ),
};
