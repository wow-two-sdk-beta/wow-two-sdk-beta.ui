import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: DropdownMenu.tsx + underlying Menu.
 * Content portals to document.body → query via `canvasElement.ownerDocument
 * .body`. Close is animation-deferred (Presence pop-out) → poll with
 * `waitFor`. Focus return to the trigger is rAF-deferred. Module-level spies
 * are cleared at play start (stories share the module).
 * No submenu support in the current implementation — not covered.
 * ------------------------------------------------------------------------- */

const onProfileSelect = fn();
const onSettingsSelect = fn();

function InteractionDemo() {
  return (
    <div className="p-12">
      <DropdownMenu>
        <DropdownMenu.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Open menu
        </DropdownMenu.Trigger>
        <DropdownMenu.Content aria-label="Interaction menu">
          <DropdownMenu.Item onSelect={onProfileSelect}>Profile</DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onSettingsSelect}>Settings</DropdownMenu.Item>
          <DropdownMenu.Item isDisabled>Billing</DropdownMenu.Item>
          <DropdownMenu.Item>Logout</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </div>
  );
}

export const OpensOnTriggerClick: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const menu = await body.findByRole('menu');
    // Pop-in starts at opacity 0 → poll visibility.
    await waitFor(() => expect(menu).toBeVisible());
    await expect(menu).toHaveAccessibleName('Interaction menu');
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Focus moves into the menu — first enabled item (FocusScope autofocus).
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveFocus(),
    );
  },
};

export const ArrowDownOnTriggerOpens: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Profile' })).toHaveFocus(),
    );
  },
};

export const ArrowUpOpensFocusingLastItem: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    trigger.focus();
    await userEvent.keyboard('{ArrowUp}');

    const menu = await body.findByRole('menu');
    await waitFor(() => expect(menu).toBeVisible());
    // APG menu-button pattern: ArrowUp-open places focus on the LAST enabled
    // item (Billing is disabled, so Logout).
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Logout' })).toHaveFocus(),
    );
  },
};

export const ArrowNavSkipsDisabledAndEnterSelects: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onProfileSelect.mockClear();
    onSettingsSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open menu' });
    await userEvent.click(trigger);
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
    // Focus returns to the trigger (rAF-deferred).
    await waitFor(() => expect(trigger).toHaveFocus());
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
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
