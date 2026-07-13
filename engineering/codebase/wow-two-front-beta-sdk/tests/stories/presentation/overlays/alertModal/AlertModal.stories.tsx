import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AlertModal } from '@src/presentation/overlays/alertModal/AlertModal';

const meta: Meta<typeof AlertModal> = {
  title: 'Overlays/AlertModal',
  component: AlertModal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AlertModal>;

export const Destructive: Story = {
  render: () => (
    <AlertModal>
      <AlertModal.Trigger className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
        Delete account
      </AlertModal.Trigger>
      <AlertModal.Content>
        <AlertModal.Header>
          <AlertModal.Title>Are you absolutely sure?</AlertModal.Title>
          <AlertModal.Description>
            This action cannot be undone. This will permanently delete your account and remove
            your data from our servers.
          </AlertModal.Description>
        </AlertModal.Header>
        <AlertModal.Footer>
          <AlertModal.Cancel>Cancel</AlertModal.Cancel>
          <AlertModal.Action
            onAction={() => alert('Deleted!')}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal.Content>
    </AlertModal>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: AlertModal.tsx source (Modal wrapper with
 * role="alertdialog" + dismissOnOutsideClick hardwired false; dismissOnEscape
 * stays true — Escape closes, per source). Content portals to document.body →
 * query via `canvasElement.ownerDocument.body`; unmount is animation-deferred
 * (Presence) → poll with `waitFor`. Module-level spy is cleared at play start.
 * NOTE (inherited Modal spec gap): scroll lock is mount-scoped
 * (ScrollLockProvider outside the Presence gate), so lock release after close
 * is NOT asserted.
 * ------------------------------------------------------------------------- */

const onAction = fn();

const interactionRender = () => (
  <AlertModal>
    <AlertModal.Trigger className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
      Delete item
    </AlertModal.Trigger>
    <AlertModal.Content>
      <AlertModal.Header>
        <AlertModal.Title>Delete item?</AlertModal.Title>
        <AlertModal.Description>This action cannot be undone.</AlertModal.Description>
      </AlertModal.Header>
      <AlertModal.Footer>
        <AlertModal.Cancel>Cancel</AlertModal.Cancel>
        <AlertModal.Action onAction={onAction}>Delete</AlertModal.Action>
      </AlertModal.Footer>
    </AlertModal.Content>
  </AlertModal>
);

export const OpensWithAlertSemantics: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Delete item' });
    await userEvent.click(trigger);

    const dialog = await body.findByRole('alertdialog');
    // Poll — the pop-in enter animation passes through opacity 0 first.
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName('Delete item?');
    await expect(dialog).toHaveAccessibleDescription('This action cannot be undone.');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Focus lands on the first tabbable affordance — the Cancel button.
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus(),
    );
  },
};

export const ActionFiresCallbackAndCloses: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    onAction.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Delete item' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const CancelClosesWithoutAction: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    onAction.mockClear();
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Delete item' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    await expect(onAction).not.toHaveBeenCalled();
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const ClosesOnEscape: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete item' }));
    await body.findByRole('alertdialog');

    // dismissOnEscape is not overridden by AlertModal → Escape closes.
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
  },
};

export const OutsideClickDoesNotClose: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Delete item' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('alertdialog');

    // A click on the centering wrapper (the outside-click target in Modal)
    // must NOT dismiss — dismissOnOutsideClick is hardwired false.
    const wrapper = dialog.parentElement?.parentElement;
    if (!wrapper) throw new Error('AlertModal centering wrapper not found');
    await userEvent.click(wrapper);

    // setOpen is synchronous — aria-expanded would flip immediately on close.
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // Poll: right after open the pop-in animation starts at opacity 0, so an
    // immediate toBeVisible can catch the first frame — wait for it to settle.
    await waitFor(() => expect(body.getByRole('alertdialog')).toBeVisible());
  },
};
