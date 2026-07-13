import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Drawer } from '@src/presentation/overlays/drawer/Drawer';

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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Drawer.tsx source.
 * Content portals to document.body → query via `canvasElement.ownerDocument
 * .body`. Exit is animation-deferred (Presence waits for the slide-out
 * transition) → poll unmount with `waitFor`. Scroll lock is open-scoped here
 * (ScrollLockProvider lives inside the Presence-gated surface), so release-
 * after-close IS asserted — unlike Modal's mount-scoped lock.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <Drawer>
    <Drawer.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
      Open drawer
    </Drawer.Trigger>
    <Drawer.Content>
      <Drawer.Close />
      <Drawer.Header>
        <Drawer.Title>Interaction test</Drawer.Title>
        <Drawer.Description>Covers open, dismissal, and focus behavior.</Drawer.Description>
      </Drawer.Header>
      <Drawer.Body>
        <p>Body content.</p>
      </Drawer.Body>
    </Drawer.Content>
  </Drawer>
);

export const OpensOnTriggerClick: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAttribute('data-side', 'right');
    await expect(dialog).toHaveAccessibleName('Interaction test');
    await expect(dialog).toHaveAccessibleDescription('Covers open, dismissal, and focus behavior.');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Body scroll is locked while open.
    await expect(doc.body).toHaveStyle({ overflow: 'hidden' });

    // Focus moves into the drawer (FocusScope autofocuses the first tabbable).
    await waitFor(() => expect(dialog.contains(doc.activeElement)).toBe(true));
  },
};

export const ClosesOnEscape: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Focus returns to the trigger (FocusScope restores on unmount).
    await waitFor(() => expect(trigger).toHaveFocus());
    // Scroll lock is released once the surface unmounts (open-scoped lock).
    await waitFor(() => expect(doc.body.style.overflow).not.toBe('hidden'));
  },
};

export const ClosesOnBackdropClick: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open drawer' }));
    const dialog = await body.findByRole('dialog');

    // The backdrop is the DismissableLayer wrapper's previous sibling inside
    // the portal node; clicking it dismisses (dismissOnOutsideClick default).
    const backdrop = dialog.parentElement?.previousElementSibling;
    if (!(backdrop instanceof HTMLElement)) throw new Error('Drawer backdrop not found');
    await userEvent.click(backdrop);

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const CloseButtonRestoresFocus: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open drawer' });
    await userEvent.click(trigger);
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
