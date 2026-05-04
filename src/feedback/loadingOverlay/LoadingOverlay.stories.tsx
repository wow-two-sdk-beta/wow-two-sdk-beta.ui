import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LoadingOverlay } from './LoadingOverlay';

const meta: Meta<typeof LoadingOverlay> = {
  title: 'Feedback/LoadingOverlay',
  component: LoadingOverlay,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof LoadingOverlay>;

export const Inline: Story = {
  render: () => (
    <div className="relative h-64 w-96 rounded-md border border-border bg-card p-4">
      <h3 className="text-base font-medium">Card content</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        The overlay is positioned inside this card. Useful for blocking a single panel.
      </p>
      <LoadingOverlay inline />
    </div>
  ),
};

export const InlineWithLabel: Story = {
  render: () => (
    <div className="relative h-64 w-96 rounded-md border border-border bg-card p-4">
      <p className="text-sm">Saving form…</p>
      <LoadingOverlay inline label="Saving changes" blur />
    </div>
  ),
};

export const Toggle: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="relative h-64 w-96 rounded-md border border-border bg-card p-4">
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => setOpen(false), 1500);
            }}
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Run for 1.5s
          </button>
          <LoadingOverlay open={open} inline label="Working…" />
        </div>
      );
    }
    return <Demo />;
  },
};
