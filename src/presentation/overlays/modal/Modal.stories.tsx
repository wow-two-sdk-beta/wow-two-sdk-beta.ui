import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open dialog
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Close />
        <Modal.Header>
          <Modal.Title>Edit profile</Modal.Title>
          <Modal.Description>
            Make changes to your profile here. Click save when you're done.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <p>Form fields would go here.</p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close className="rounded-md border border-border px-3 py-1.5 text-sm">
            Cancel
          </Modal.Close>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Save
          </button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const Blurred: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open with blur
      </Modal.Trigger>
      <Modal.Content isBlurred>
        <Modal.Close />
        <Modal.Header>
          <Modal.Title>Welcome</Modal.Title>
          <Modal.Description>The backdrop is blurred behind the modal.</Modal.Description>
        </Modal.Header>
        <Modal.Body>Content body.</Modal.Body>
      </Modal.Content>
    </Modal>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Modal.spec.md "Required behaviors".
 * Content portals to document.body, so open-state queries go through
 * `canvasElement.ownerDocument.body`, not the canvas. Close is animation-
 * deferred (Presence waits for the exit animation) → poll with `waitFor`.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <Modal>
    <Modal.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
      Open dialog
    </Modal.Trigger>
    <Modal.Content>
      <Modal.Close />
      <Modal.Header>
        <Modal.Title>Interaction test</Modal.Title>
        <Modal.Description>Covers open, dismissal, and focus behavior.</Modal.Description>
      </Modal.Header>
      <Modal.Body>
        <p>Body content.</p>
      </Modal.Body>
    </Modal.Content>
  </Modal>
);

export const OpensOnTriggerClick: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const dialog = await body.findByRole('dialog');
    // Pop-in keyframes start at opacity 0 — poll past the enter animation.
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName('Interaction test');
    await expect(dialog).toHaveAccessibleDescription('Covers open, dismissal, and focus behavior.');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Body scroll is locked while open (open-scoped via isEnabled).
    await expect(doc.body).toHaveStyle({ overflow: 'hidden' });

    // Focus moves into the dialog (FocusScope autofocuses the first tabbable).
    await waitFor(() => expect(dialog.contains(doc.activeElement)).toBe(true));
  },
};

export const ClosesOnEscape: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Focus returns to the trigger (FocusScope restores on unmount).
    await waitFor(() => expect(trigger).toHaveFocus());
    // Scroll lock releases on close (lock is open-scoped via isEnabled).
    await waitFor(() => expect(doc.body).not.toHaveStyle({ overflow: 'hidden' }));
  },
};

export const ClosesOnOutsideClick: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open dialog' }));
    const dialog = await body.findByRole('dialog');

    // Outside-click dismissal lives on the centering wrapper (panel's
    // grandparent): a click landing on it — not the panel — counts as outside.
    const wrapper = dialog.parentElement?.parentElement;
    if (!wrapper) throw new Error('Modal centering wrapper not found');
    await userEvent.click(wrapper);

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const CloseButtonRestoresFocus: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open dialog' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

export const MountedClosedDoesNotLockScroll: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    // Content is mounted (closed) — the lock must not engage until open.
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    await expect(doc.body).not.toHaveStyle({ overflow: 'hidden' });
  },
};
