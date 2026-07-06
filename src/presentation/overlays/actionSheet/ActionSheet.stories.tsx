import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ActionSheet, ActionSheetAction, ActionSheetCancel } from './ActionSheet';

const meta: Meta = {
  title: 'Overlays/ActionSheet',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Open action sheet
          </button>
          <ActionSheet
            open={open}
            onOpenChange={setOpen}
            title="Choose an action"
            description="What would you like to do?"
          >
            <ActionSheetAction onSelect={() => alert('Save')}>Save changes</ActionSheetAction>
            <ActionSheetAction onSelect={() => alert('Share')}>Share</ActionSheetAction>
            <ActionSheetAction isDestructive onSelect={() => alert('Delete')}>
              Delete
            </ActionSheetAction>
            <ActionSheetCancel />
          </ActionSheet>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: ActionSheet.tsx source (opinionated
 * bottom Drawer). No Trigger subcomponent — controlled via useState + button.
 * The sheet portals to document.body → query via `canvasElement.ownerDocument
 * .body`; unmount is animation-deferred (Drawer's Presence slide-out) → poll
 * with `waitFor`. Module-level spies are cleared at play start. Scroll lock is
 * open-scoped (inherited from Drawer's Presence-gated surface).
 * ------------------------------------------------------------------------- */

const onSave = fn();
const onDelete = fn();

function InteractionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open action sheet
      </button>
      <ActionSheet
        open={open}
        onOpenChange={setOpen}
        title="Choose an action"
        description="What would you like to do?"
      >
        <ActionSheetAction onSelect={onSave}>Save changes</ActionSheetAction>
        <ActionSheetAction isDestructive onSelect={onDelete}>
          Delete
        </ActionSheetAction>
        <ActionSheetCancel />
      </ActionSheet>
    </div>
  );
}

export const OpensWithActionsListed: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open action sheet' }));

    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName('Choose an action');
    await expect(dialog).toHaveAccessibleDescription('What would you like to do?');
    // Bottom-edge Drawer under the hood.
    await expect(dialog).toHaveAttribute('data-side', 'bottom');

    // All actions + the separated cancel affordance are listed.
    await expect(within(dialog).getByRole('button', { name: 'Save changes' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Delete' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeVisible();
  },
};

export const ActionSelectFiresAndCloses: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onSave.mockClear();
    onDelete.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open action sheet' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

    await expect(onSave).toHaveBeenCalledTimes(1);
    await expect(onDelete).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const CancelClosesWithoutSelection: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    onSave.mockClear();
    onDelete.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open action sheet' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(onSave).not.toHaveBeenCalled();
    await expect(onDelete).not.toHaveBeenCalled();
  },
};

export const ClosesOnEscape: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const opener = canvas.getByRole('button', { name: 'Open action sheet' });
    await userEvent.click(opener);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Focus returns to the opener (Drawer's FocusScope restores on unmount).
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
