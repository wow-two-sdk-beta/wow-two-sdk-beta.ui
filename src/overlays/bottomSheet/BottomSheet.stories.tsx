import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';

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
            <h2 className="mb-2 text-lg font-semibold">Sheet content</h2>
            <p className="text-sm text-muted-foreground">
              Drag the handle up/down to resize. Drag below the smallest snap to dismiss. Use ↑/↓ on
              the focused handle for keyboard control.
            </p>
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
