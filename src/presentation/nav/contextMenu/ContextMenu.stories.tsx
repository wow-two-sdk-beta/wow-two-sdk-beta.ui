import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ContextMenu } from './ContextMenu';

const meta: Meta<typeof ContextMenu> = {
  title: 'Nav/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <div className="p-12">
      <ContextMenu>
        <ContextMenu.Trigger>
          <div className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Right-click me
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content>
          <ContextMenu.Item onSelect={() => alert('Cut')}>Cut</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => alert('Copy')}>Copy</ContextMenu.Item>
          <ContextMenu.Item onSelect={() => alert('Paste')}>Paste</ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item state="destructive" onSelect={() => alert('Delete')}>
            Delete
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: ContextMenu.tsx + underlying Menu.
 * Right-click = `userEvent.pointer` with `[MouseRight]` (fires contextmenu).
 * The menu portals to document.body → query via `canvasElement.ownerDocument
 * .body`; close is animation-deferred → poll with `waitFor`. No focus-return
 * assertion on close: the trigger is a non-focusable div and ContextMenu
 * restores nothing itself (see report). Module-level spies are cleared at
 * play start (stories share the module).
 * ------------------------------------------------------------------------- */

const onCopySelect = fn();
const onPasteSelect = fn();

function InteractionDemo() {
  return (
    <div className="p-12">
      <ContextMenu>
        <ContextMenu.Trigger>
          <div
            data-testid="context-target"
            className="flex h-32 w-64 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground"
          >
            Right-click me
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content aria-label="Context actions">
          <ContextMenu.Item>Cut</ContextMenu.Item>
          <ContextMenu.Item onSelect={onCopySelect}>Copy</ContextMenu.Item>
          <ContextMenu.Item isDisabled>Rename</ContextMenu.Item>
          <ContextMenu.Item onSelect={onPasteSelect}>Paste</ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu>
    </div>
  );
}

export const RightClickOpensMenu: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const target = canvas.getByTestId('context-target');

    // Plain left click must NOT open the menu.
    await userEvent.click(target);
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();

    await userEvent.pointer({ keys: '[MouseRight]', target });

    const menu = await body.findByRole('menu');
    // Pop-in starts at opacity 0 → poll visibility.
    await waitFor(() => expect(menu).toBeVisible());
    await expect(menu).toHaveAccessibleName('Context actions');
    await expect(within(menu).getAllByRole('menuitem')).toHaveLength(4);
    // Focus moves into the menu — first enabled item (FocusScope autofocus).
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Cut' })).toHaveFocus(),
    );
  },
};

export const ArrowNavSkipsDisabledAndEnterSelects: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onCopySelect.mockClear();
    onPasteSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.pointer({
      keys: '[MouseRight]',
      target: canvas.getByTestId('context-target'),
    });
    const menu = await body.findByRole('menu');
    const item = (name: string) => within(menu).getByRole('menuitem', { name });

    await waitFor(() => expect(item('Cut')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Copy')).toHaveFocus());

    // Disabled item (Rename) is skipped.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(item('Paste')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(item('Copy')).toHaveFocus());

    // Enter invokes onSelect exactly once and closes the menu.
    await userEvent.keyboard('{Enter}');
    await expect(onCopySelect).toHaveBeenCalledTimes(1);
    await expect(onPasteSelect).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

export const ItemClickFiresAndCloses: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onPasteSelect.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.pointer({
      keys: '[MouseRight]',
      target: canvas.getByTestId('context-target'),
    });
    const menu = await body.findByRole('menu');

    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Paste' }));

    await expect(onPasteSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};

export const EscapeCloses: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.pointer({
      keys: '[MouseRight]',
      target: canvas.getByTestId('context-target'),
    });
    await body.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('menu')).not.toBeInTheDocument());
  },
};
