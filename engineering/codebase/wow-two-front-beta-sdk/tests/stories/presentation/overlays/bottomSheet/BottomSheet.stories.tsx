import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { BottomSheet, BottomSheetDescription, BottomSheetTitle } from '@src/presentation/overlays/bottomSheet/BottomSheet';

const meta: Meta<typeof BottomSheet> = {
  title: 'Overlays/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof BottomSheet>;

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
            Open bottom sheet
          </button>
          <BottomSheet open={open} onOpenChange={setOpen} snapPoints={['30vh', '60vh', '90vh']} initialSnap={1}>
            <BottomSheetTitle className="mb-2">Sheet content</BottomSheetTitle>
            <BottomSheetDescription>
              Drag the handle up/down to resize. Drag below the smallest snap to dismiss. Use ↑/↓ on
              the focused handle for keyboard control.
            </BottomSheetDescription>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="rounded-md border border-border p-3 text-sm">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </BottomSheet>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — oracle: BottomSheet.tsx source.
 * No Trigger subcomponent — the sheet is controlled, so the demo wires a
 * button + useState. Content portals to document.body → query via
 * `canvasElement.ownerDocument.body`. Unmount is Presence-deferred (exit
 * slide) → poll with `waitFor`. Scroll lock is open-scoped (the surface
 * unmounts when closed), so release IS asserted. Focus contract: open puts
 * initial focus on the drag handle; every dismissal (Escape / backdrop /
 * keyboard) returns focus to the previously-focused element via FocusScope's
 * unmount restore. Snap heights use px points so the inline style is
 * deterministic.
 * ------------------------------------------------------------------------- */

function InteractionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Open sheet
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} snapPoints={['200px', '400px']}>
        <BottomSheetTitle className="mb-2">Sheet title</BottomSheetTitle>
        <BottomSheetDescription>Sheet description.</BottomSheetDescription>
        <p className="mt-2 text-sm">Sheet body.</p>
      </BottomSheet>
    </div>
  );
}

export const OpensViaControlledState: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));

    const dialog = await body.findByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(dialog).toHaveAccessibleName('Sheet title');
    await expect(dialog).toHaveAccessibleDescription('Sheet description.');
    // Opens at the initial snap (index 0 → 200px).
    await expect(dialog.style.height).toBe('200px');

    // Drag handle is a keyboard-reachable separator exposing the snap state.
    const handle = within(dialog).getByRole('separator');
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    await expect(handle).toHaveAttribute('aria-valuemin', '0');
    await expect(handle).toHaveAttribute('aria-valuemax', '1');
    // Mount autofocus lands on the handle — the sheet's keyboard affordance.
    await waitFor(() => expect(handle).toHaveFocus());

    // Body scroll is locked while open.
    await expect(doc.body).toHaveStyle({ overflow: 'hidden' });
  },
};

export const SnapsWithArrowKeys: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Open sheet' }));
    const dialog = await body.findByRole('dialog');
    const handle = within(dialog).getByRole('separator');

    // Mount autofocus puts the handle in charge — ArrowUp/ArrowDown drive
    // the snap state without an explicit focus step.
    await waitFor(() => expect(handle).toHaveFocus());

    await userEvent.keyboard('{ArrowUp}');
    await expect(handle).toHaveAttribute('aria-valuenow', '1');
    await expect(dialog.style.height).toBe('400px');

    await userEvent.keyboard('{ArrowDown}');
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    await expect(dialog.style.height).toBe('200px');
  },
};

export const ArrowDownAtLowestSnapDismisses: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const opener = canvas.getByRole('button', { name: 'Open sheet' });
    await userEvent.click(opener);
    const dialog = await body.findByRole('dialog');
    const handle = within(dialog).getByRole('separator');
    await waitFor(() => expect(handle).toHaveFocus());

    // At the lowest snap, ArrowDown dismisses (dragToDismiss default true).
    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Keyboard dismissal hands focus back to the opener (FocusScope restores
    // on unmount) and releases the open-scoped scroll lock.
    await waitFor(() => expect(opener).toHaveFocus());
    await waitFor(() => expect(doc.body.style.overflow).not.toBe('hidden'));
  },
};

export const ClosesOnEscape: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const opener = canvas.getByRole('button', { name: 'Open sheet' });
    await userEvent.click(opener);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Focus returns to the opener (FocusScope restores on unmount).
    await waitFor(() => expect(opener).toHaveFocus());
    await waitFor(() => expect(doc.body.style.overflow).not.toBe('hidden'));
  },
};

export const ClosesOnBackdropClick: Story = {
  render: () => <InteractionDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const opener = canvas.getByRole('button', { name: 'Open sheet' });
    await userEvent.click(opener);
    const dialog = await body.findByRole('dialog');

    // Backdrop = the DismissableLayer wrapper's previous sibling in the portal.
    const backdrop = dialog.parentElement?.previousElementSibling;
    if (!(backdrop instanceof HTMLElement)) throw new Error('BottomSheet backdrop not found');
    await userEvent.click(backdrop);

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    // Backdrop dismissal also hands focus back to the opener.
    await waitFor(() => expect(opener).toHaveFocus());
  },
};
