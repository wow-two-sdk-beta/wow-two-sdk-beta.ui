import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { UndoBar } from '@src/presentation/feedback/undoBar/UndoBar';

const meta: Meta<typeof UndoBar> = {
  title: 'Feedback/UndoBar',
  component: UndoBar,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof UndoBar>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="space-y-3">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            onClick={() => setOpen(true)}
          >
            Delete item
          </button>
          <UndoBar
            isOpen={open}
            onOpenChange={setOpen}
            message="Item deleted"
            onUndo={() => alert('Restored!')}
            hasCountdown
          />
        </div>
      );
    }
    return <Demo />;
  },
};

export const Sticky: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="space-y-3">
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
            onClick={() => setOpen(true)}
          >
            Show sticky bar
          </button>
          <UndoBar
            isOpen={open}
            onOpenChange={setOpen}
            message="Permanent action — must explicitly undo"
            onUndo={() => alert('Undone')}
            duration={Infinity}
          />
        </div>
      );
    }
    return <Demo />;
  },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — the bar portals to document.body, so open-state
 * queries go through `canvasElement.ownerDocument.body`. Enter/exit slide via
 * Presence → absence assertions poll with `waitFor`. Expiry uses a SHORT real
 * duration (no fake timers in stories — docs/testing.md).
 * ------------------------------------------------------------------------- */

type PlayArgs = {
  onUndo: ReturnType<typeof fn>;
  onOpenChange: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<PlayArgs>;

const playDemo = (args: PlayArgs, duration: number) => {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <div className="space-y-3">
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
          onClick={() => setOpen(true)}
        >
          Delete item
        </button>
        <UndoBar
          isOpen={open}
          onOpenChange={(next) => {
            args.onOpenChange(next);
            setOpen(next);
          }}
          message="Item deleted"
          onUndo={args.onUndo}
          duration={duration}
          hasCountdown
        />
      </div>
    );
  }
  return <Demo />;
};

export const UndoClickFiresCallbackAndHides: PlayStory = {
  args: { onUndo: fn(), onOpenChange: fn() },
  render: (args) => playDemo(args, Infinity),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete item' }));

    // Appears with the action; polite status semantics.
    const bar = await body.findByRole('status');
    await waitFor(() => expect(bar).toBeVisible());
    await expect(bar).toHaveAttribute('aria-live', 'polite');
    await expect(bar).toHaveTextContent('Item deleted');

    await userEvent.click(within(bar).getByRole('button', { name: 'Undo' }));

    await expect(args.onUndo).toHaveBeenCalledTimes(1);
    await expect(args.onOpenChange).toHaveBeenCalledWith(false);
    // Exit slide plays before unmount.
    await waitFor(() => expect(body.queryByRole('status')).not.toBeInTheDocument());
  },
};

export const AutoExpiresWithoutUndo: PlayStory = {
  args: { onUndo: fn(), onOpenChange: fn() },
  render: (args) => playDemo(args, 600),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Delete item' }));
    await body.findByRole('status');

    // The expire path closes the bar without ever invoking the undo callback.
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false), {
      timeout: 1500,
    });
    await expect(args.onUndo).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('status')).not.toBeInTheDocument());
  },
};
