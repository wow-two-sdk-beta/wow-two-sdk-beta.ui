import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Menubar.tsx + underlying Menu.
 * Triggers are `role=menuitem` inside `role=menubar`; popups portal to
 * document.body → query popups via `canvasElement.ownerDocument.body` and
 * triggers via the canvas menubar. Open/close is animation-deferred
 * (Presence) and focus hand-off is rAF-deferred → poll with `waitFor`.
 * Module-level spies are cleared at play start (stories share the module).
 * ------------------------------------------------------------------------- */

const onNewSelect = fn();
const onUndoSelect = fn();

function InteractionDemo() {
  return (
    <Menubar aria-label="Interaction menubar">
      <Menubar.Menu value="file">
        <Menubar.Trigger>File</Menubar.Trigger>
        <Menubar.Content aria-label="File menu">
          <Menubar.Item onSelect={onNewSelect}>New</Menubar.Item>
          <Menubar.Item>Open…</Menubar.Item>
          <Menubar.Item isDisabled>Save</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="edit">
        <Menubar.Trigger>Edit</Menubar.Trigger>
        <Menubar.Content aria-label="Edit menu">
          <Menubar.Item onSelect={onUndoSelect}>Undo</Menubar.Item>
          <Menubar.Item>Redo</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
      <Menubar.Menu value="view">
        <Menubar.Trigger>View</Menubar.Trigger>
        <Menubar.Content aria-label="View menu">
          <Menubar.Item>Zoom in</Menubar.Item>
          <Menubar.Item>Zoom out</Menubar.Item>
        </Menubar.Content>
      </Menubar.Menu>
    </Menubar>
  );
}

export const ArrowKeysMoveAcrossTriggers: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const bar = canvas.getByRole('menubar');
    const trigger = (name: string) => within(bar).getByRole('menuitem', { name });

    trigger('File').focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(trigger('Edit')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(trigger('View')).toHaveFocus());

    // Wraps around at both ends.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(trigger('File')).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(trigger('View')).toHaveFocus());

    // Home / End jump to the first / last trigger.
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(trigger('File')).toHaveFocus());
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(trigger('View')).toHaveFocus());

    // Roving focus alone never opens a popup.
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const ArrowDownOpensAndEnterSelects: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onNewSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const fileTrigger = within(canvas.getByRole('menubar')).getByRole('menuitem', {
      name: 'File',
    });

    fileTrigger.focus();
    await userEvent.keyboard('{ArrowDown}');

    const menu = await body.findByRole('menu');
    await expect(menu).toHaveAccessibleName('File menu');
    await expect(fileTrigger).toHaveAttribute('aria-expanded', 'true');
    // Focus lands on the first item.
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'New' })).toHaveFocus(),
    );

    // Enter selects it, closes the popup, and returns focus to the trigger.
    await userEvent.keyboard('{Enter}');
    await expect(onNewSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(fileTrigger).toHaveFocus());
    await expect(fileTrigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ArrowRightSwitchesOpenMenus: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const bar = canvas.getByRole('menubar');
    const trigger = (name: string) => within(bar).getByRole('menuitem', { name });

    await userEvent.click(trigger('File'));
    const fileMenu = await body.findByRole('menu');
    await expect(fileMenu).toHaveAccessibleName('File menu');
    await waitFor(() =>
      expect(within(fileMenu).getByRole('menuitem', { name: 'New' })).toHaveFocus(),
    );

    // ArrowRight from inside the open popup closes it and opens the adjacent menu.
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(trigger('Edit')).toHaveAttribute('aria-expanded', 'true'));
    await expect(trigger('File')).toHaveAttribute('aria-expanded', 'false');
    const editMenu = await body.findByRole('menu', { name: 'Edit menu' });
    // Pop-in starts at opacity 0 → poll visibility.
    await waitFor(() =>
      expect(within(editMenu).getByRole('menuitem', { name: 'Undo' })).toBeVisible(),
    );
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'File menu' })).not.toBeInTheDocument(),
    );

    // And back with ArrowLeft.
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(trigger('File')).toHaveAttribute('aria-expanded', 'true'));
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'Edit menu' })).not.toBeInTheDocument(),
    );
  },
};

export const HoverSwitchesMenusWhileOpen: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const bar = canvas.getByRole('menubar');
    const trigger = (name: string) => within(bar).getByRole('menuitem', { name });

    // Hover alone does not open anything while the menubar is closed.
    await userEvent.hover(trigger('Edit'));
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();

    // Open File, then hovering Edit switches the open menu.
    await userEvent.click(trigger('File'));
    await body.findByRole('menu', { name: 'File menu' });
    await userEvent.hover(trigger('Edit'));
    await body.findByRole('menu', { name: 'Edit menu' });
    await waitFor(() =>
      expect(body.queryByRole('menu', { name: 'File menu' })).not.toBeInTheDocument(),
    );
    await expect(trigger('Edit')).toHaveAttribute('aria-expanded', 'true');
  },
};

export const ClickSelectionClosesAndRestoresFocus: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onUndoSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const editTrigger = within(canvas.getByRole('menubar')).getByRole('menuitem', {
      name: 'Edit',
    });

    await userEvent.click(editTrigger);
    const menu = await body.findByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Undo' }));

    await expect(onUndoSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(editTrigger).toHaveFocus());
  },
};
