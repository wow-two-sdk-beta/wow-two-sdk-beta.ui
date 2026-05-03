import type { Meta, StoryObj } from '@storybook/react';
import { Menubar } from './Menubar';

const meta: Meta<typeof Menubar> = {
  title: 'Nav/Menubar',
  component: Menubar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Menubar>;

export const Default: Story = {
  render: () => (
    <Menubar>
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item onSelect={() => alert('New')}>New</Menubar.Item>
          <Menubar.Item onSelect={() => alert('Open')}>Open…</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Save</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item state="destructive">Quit</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Undo</Menubar.Item>
          <Menubar.Item>Redo</Menubar.Item>
          <Menubar.Separator />
          <Menubar.Item>Cut</Menubar.Item>
          <Menubar.Item>Copy</Menubar.Item>
          <Menubar.Item>Paste</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="view">
        <Menubar.Trigger>View</Menubar.Trigger>
        <Menubar.Content>
          <Menubar.Item>Zoom in</Menubar.Item>
          <Menubar.Item>Zoom out</Menubar.Item>
          <Menubar.Item>Reset zoom</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  ),
};
