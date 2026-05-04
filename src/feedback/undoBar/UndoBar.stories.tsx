import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { UndoBar } from './UndoBar';

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
            open={open}
            onOpenChange={setOpen}
            message="Item deleted"
            onUndo={() => alert('Restored!')}
            showCountdown
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
            open={open}
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
