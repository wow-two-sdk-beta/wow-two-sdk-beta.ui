import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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
        <Menu.Item isDisabled>Save (disabled)</Menu.Item>
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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Menu.spec.md "Required behaviors".
 * The menu portals to document.body → query via `canvasElement.ownerDocument
 * .body`. Close is animation-deferred (Presence) → poll with `waitFor`.
 * Module-level spies are cleared at play start (stories share the module).
 * ------------------------------------------------------------------------- */

const onProfileSelect = fn();
const onSettingsSelect = fn();

function InteractionDemo() {
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
        aria-label="Interaction menu"
      >
        <Menu.Item onSelect={onProfileSelect}>Profile</Menu.Item>
        <Menu.Item onSelect={onSettingsSelect}>Settings</Menu.Item>
        <Menu.Item isDisabled>Billing</Menu.Item>
        <Menu.Item>Logout</Menu.Item>
      </Menu>
    </div>
  );
}

export const OpensOnTriggerClick: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));

    const menu = await body.findByRole('menu');
    // Pop-in keyframes start at opacity 0 — poll past the enter animation.
    await waitFor(() => expect(menu).toBeVisible());
    await expect(menu).toHaveAccessibleName('Interaction menu');
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);

    // Focus moves into the menu — first enabled item.
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveFocus(),
    );
  },
};

export const ArrowKeysNavigateAndEnterSelects: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onProfileSelect.mockClear();
    onSettingsSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open menu' }));
    const menu = await body.findByRole('menu');
    const item = (name: string) => within(menu).getByRole('menuitem', { name });

    await waitFor(() => expect(item('Profile')).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Settings')).toHaveFocus());

    // Disabled item (Billing) is skipped in both directions.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Logout')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Settings')).toHaveFocus());

    // Enter invokes onSelect exactly once and closes the menu.
    await userEvent.keyboard('{Enter}');
    await expect(onSettingsSelect).toHaveBeenCalledTimes(1);
    await expect(onProfileSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

export const EscapeClosesAndRestoresFocus: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    await userEvent.click(trigger);
    await body.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    // Focus returns to the trigger (FocusScope restores on unmount).
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
