import type { Meta, StoryObj } from '@storybook/react';
import { Tabs } from './Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'Display/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Tab value="usage" disabled>Usage</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="overview" className="p-3">
        Overview content. Arrow keys move focus; selected tab has the underline.
      </Tabs.Panel>
      <Tabs.Panel value="settings" className="p-3">
        Settings content.
      </Tabs.Panel>
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="account">Account</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="general" className="p-3">
        General settings.
      </Tabs.Panel>
      <Tabs.Panel value="account" className="p-3">
        Account preferences.
      </Tabs.Panel>
      <Tabs.Panel value="notifications" className="p-3">
        Notification preferences.
      </Tabs.Panel>
    </Tabs>
  ),
};

export const ManualActivation: Story = {
  render: () => (
    <Tabs defaultValue="a" activationMode="manual" className="w-96">
      <Tabs.List>
        <Tabs.Tab value="a">Tab A</Tabs.Tab>
        <Tabs.Tab value="b">Tab B</Tabs.Tab>
        <Tabs.Tab value="c">Tab C</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="a" className="p-3">A — arrow keys move focus, Enter activates.</Tabs.Panel>
      <Tabs.Panel value="b" className="p-3">B</Tabs.Panel>
      <Tabs.Panel value="c" className="p-3">C</Tabs.Panel>
    </Tabs>
  ),
};
