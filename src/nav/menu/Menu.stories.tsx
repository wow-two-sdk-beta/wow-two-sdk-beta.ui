import type { Meta, StoryObj } from '@storybook/react';
import { useRef, useState } from 'react';
import { Menu } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Nav/Menu',
  component: Menu,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Menu>;

function DefaultDemo() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="p-12">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-border px-3 py-1.5 text-sm"
      >
        Open menu
      </button>
      <Menu
        open={open}
        anchor={anchorRef.current}
        onClose={() => setOpen(false)}
        aria-label="Demo menu"
      >
        <Menu.Item onSelect={() => alert('New')}>New</Menu.Item>
        <Menu.Item onSelect={() => alert('Open')}>Open…</Menu.Item>
        <Menu.Item disabled>Save (disabled)</Menu.Item>
        <Menu.Separator />
        <Menu.Item state="destructive" onSelect={() => alert('Delete')}>
          Delete
        </Menu.Item>
      </Menu>
    </div>
  );
}

function GroupedDemo() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  return (
    <div className="p-12">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md border border-border px-3 py-1.5 text-sm"
      >
        Open
      </button>
      <Menu open={open} anchor={anchorRef.current} onClose={() => setOpen(false)}>
        <Menu.Group label="File">
          <Menu.Item>New</Menu.Item>
          <Menu.Item>Open</Menu.Item>
        </Menu.Group>
        <Menu.Separator />
        <Menu.Group label="Edit">
          <Menu.Item>Cut</Menu.Item>
          <Menu.Item>Copy</Menu.Item>
          <Menu.Item>Paste</Menu.Item>
        </Menu.Group>
      </Menu>
    </div>
  );
}

export const Default: Story = { render: () => <DefaultDemo /> };
export const Grouped: Story = { render: () => <GroupedDemo /> };
