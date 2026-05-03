import type { Meta, StoryObj } from '@storybook/react';
import { Drawer } from './Drawer';

const meta: Meta<typeof Drawer> = {
  title: 'Overlays/Drawer',
  component: Drawer,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Drawer>;

export const Right: Story = {
  render: () => (
    <Drawer>
      <Drawer.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
        Open right
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Close />
        <Drawer.Header>
          <Drawer.Title>Settings</Drawer.Title>
          <Drawer.Description>Edit your preferences here.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>
          <p>Body content scrolls if it overflows.</p>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close className="rounded-md border border-border px-3 py-1.5 text-sm">
            Close
          </Drawer.Close>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  ),
};

export const Left: Story = {
  render: () => (
    <Drawer side="left">
      <Drawer.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
        Open left
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Close />
        <Drawer.Header>
          <Drawer.Title>Navigation</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          <ul className="flex flex-col gap-2">
            <li>Home</li>
            <li>Profile</li>
            <li>Settings</li>
          </ul>
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Drawer side="bottom">
      <Drawer.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
        Open bottom
      </Drawer.Trigger>
      <Drawer.Content>
        <Drawer.Close />
        <Drawer.Header>
          <Drawer.Title>Mobile sheet</Drawer.Title>
          <Drawer.Description>Slides up from the bottom edge.</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>Sheet content.</Drawer.Body>
      </Drawer.Content>
    </Drawer>
  ),
};
