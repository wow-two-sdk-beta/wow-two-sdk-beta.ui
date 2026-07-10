import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Check } from 'lucide-react';
import { Icon } from '../../../foundation/icons';
import { Toast } from './Toast';

const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: {
    icon: <Icon icon={Check} size={16} className="text-success" />,
    title: 'Saved',
    description: 'Your changes are live.',
    onClose: () => {},
  },
  render: (args) => <div className="w-80"><Toast {...args} /></div>,
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — the molecule is visual-only (queue / lifecycle
 * live in Toaster): callbacks fire, semantics hold; removal is the caller's.
 * ------------------------------------------------------------------------- */

type ToastPlayArgs = {
  onClose: ReturnType<typeof fn>;
  onAction: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<ToastPlayArgs>;

export const DismissButtonFiresOnClose: PlayStory = {
  args: { onClose: fn(), onAction: fn() },
  render: (args) => (
    <div className="w-80">
      <Toast title="Saved" description="Your changes are live." onClose={args.onClose} />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Polite status semantics by default.
    const toast = canvas.getByRole('status');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
    await expect(toast).toHaveTextContent('Saved');
    await expect(toast).toHaveTextContent('Your changes are live.');

    await userEvent.click(within(toast).getByRole('button', { name: 'Dismiss' }));
    await expect(args.onClose).toHaveBeenCalledTimes(1);
  },
};

export const ActionButtonFiresCallback: PlayStory = {
  args: { onClose: fn(), onAction: fn() },
  render: (args) => (
    <div className="w-80">
      <Toast
        title="File archived"
        onClose={args.onClose}
        actions={
          <button
            type="button"
            onClick={args.onAction}
            className="text-sm font-medium text-primary hover:underline"
          >
            Undo
          </button>
        }
      />
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Undo' }));

    await expect(args.onAction).toHaveBeenCalledTimes(1);
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};
