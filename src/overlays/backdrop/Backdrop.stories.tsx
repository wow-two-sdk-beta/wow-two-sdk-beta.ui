import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Backdrop } from './Backdrop';

const meta: Meta<typeof Backdrop> = {
  title: 'Overlays/Backdrop',
  component: Backdrop,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Backdrop>;

function Demo({ blur }: { blur?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-12">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
      >
        Show backdrop {blur ? '(blur)' : ''}
      </button>
      {open && (
        <Backdrop blur={blur} onClick={() => setOpen(false)}>
          <div className="grid h-full place-items-center text-white">
            Click anywhere to close
          </div>
        </Backdrop>
      )}
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };
export const Blurred: Story = { render: () => <Demo blur /> };
