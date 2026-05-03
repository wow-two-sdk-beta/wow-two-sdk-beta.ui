import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';

const meta: Meta<typeof Dialog> = {
  title: 'Overlays/Dialog',
  component: Dialog,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open dialog
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Close />
        <Dialog.Header>
          <Dialog.Title>Edit profile</Dialog.Title>
          <Dialog.Description>
            Make changes to your profile here. Click save when you're done.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>
          <p>Form fields would go here.</p>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Close className="rounded-md border border-border px-3 py-1.5 text-sm">
            Cancel
          </Dialog.Close>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Save
          </button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  ),
};

export const Blurred: Story = {
  render: () => (
    <Dialog>
      <Dialog.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open with blur
      </Dialog.Trigger>
      <Dialog.Content blur>
        <Dialog.Close />
        <Dialog.Header>
          <Dialog.Title>Welcome</Dialog.Title>
          <Dialog.Description>The backdrop is blurred behind the modal.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body>Content body.</Dialog.Body>
      </Dialog.Content>
    </Dialog>
  ),
};
