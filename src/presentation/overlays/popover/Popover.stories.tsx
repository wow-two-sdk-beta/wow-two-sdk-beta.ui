import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Popover } from './Popover';

const meta: Meta<typeof Popover> = {
  title: 'Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <div className="p-12">
      <Popover>
        <Popover.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Open popover
        </Popover.Trigger>
        <Popover.Content>
          <h3 className="mb-2 text-sm font-semibold">Settings</h3>
          <p className="text-sm text-muted-foreground">
            Adjust user preferences here. Click outside to close.
          </p>
        </Popover.Content>
      </Popover>
    </div>
  ),
};

export const TopPlacement: Story = {
  render: () => (
    <div className="p-32">
      <Popover placement="top">
        <Popover.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
          Top
        </Popover.Trigger>
        <Popover.Content>Anchored above the trigger.</Popover.Content>
      </Popover>
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: Popover.tsx source.
 * Content portals to document.body → query via `canvasElement.ownerDocument
 * .body`. Exit is animation-deferred (Presence + pop-out) → poll unmount with
 * `waitFor`. Positioning is async (floating-ui autoUpdate) → geometry asserts
 * also poll. NOTE (source divergence from the usual non-modal popover shape):
 * FocusScope is `trapped loop`, so focus IS trapped inside while open.
 * ------------------------------------------------------------------------- */

const interactionRender = () => (
  <div className="p-12">
    <Popover>
      <Popover.Trigger className="rounded-md border border-border px-3 py-1.5 text-sm">
        Open popover
      </Popover.Trigger>
      <Popover.Content aria-label="Interaction popover">
        <p className="text-sm">Popover body.</p>
        <button type="button" className="mt-2 rounded-md border border-border px-2 py-1 text-sm">
          Panel action
        </button>
      </Popover.Content>
    </Popover>
  </div>
);

export const OpensAnchoredToTrigger: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: 'Open popover' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    const dialog = await body.findByRole('dialog');
    // Poll — the pop-in enter animation passes through opacity 0 first.
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAccessibleName('Interaction popover');
    // Non-modal dialog surface: no aria-modal.
    await expect(dialog).not.toHaveAttribute('aria-modal');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Positioned below the trigger (default placement "bottom", offset 8).
    await waitFor(() => {
      const t = trigger.getBoundingClientRect();
      const d = dialog.getBoundingClientRect();
      expect(d.top).toBeGreaterThanOrEqual(t.bottom + 7);
    });

    // Focus moves into the panel (FocusScope trapped — per source).
    await waitFor(() => expect(dialog.contains(doc.activeElement)).toBe(true));
  },
};

export const ClosesOnEscapeAndRestoresFocus: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open popover' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Explicit rAF restore in the onEscape handler.
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const ClosesOnOutsideClick: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open popover' }));
    await body.findByRole('dialog');

    // Pointer-down outside the layer (and outside the trigger) dismisses.
    await userEvent.click(canvasElement);

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const TriggerClickTogglesClosed: Story = {
  render: interactionRender,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: 'Open popover' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    // Outside-pointer-down ignores the trigger, so the click reaches the
    // toggle handler and closes (setOpen(!open) — per source).
    await userEvent.click(trigger);

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
