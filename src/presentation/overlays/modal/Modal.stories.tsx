import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'Overlays/Modal',
  component: Modal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open dialog
      </Modal.Trigger>
      <Modal.Content>
        <Modal.Close />
        <Modal.Header>
          <Modal.Title>Edit profile</Modal.Title>
          <Modal.Description>
            Make changes to your profile here. Click save when you're done.
          </Modal.Description>
        </Modal.Header>
        <Modal.Body>
          <p>Form fields would go here.</p>
        </Modal.Body>
        <Modal.Footer>
          <Modal.Close className="rounded-md border border-border px-3 py-1.5 text-sm">
            Cancel
          </Modal.Close>
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            Save
          </button>
        </Modal.Footer>
      </Modal.Content>
    </Modal>
  ),
};

export const Blurred: Story = {
  render: () => (
    <Modal>
      <Modal.Trigger className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">
        Open with blur
      </Modal.Trigger>
      <Modal.Content isBlurred>
        <Modal.Close />
        <Modal.Header>
          <Modal.Title>Welcome</Modal.Title>
          <Modal.Description>The backdrop is blurred behind the modal.</Modal.Description>
        </Modal.Header>
        <Modal.Body>Content body.</Modal.Body>
      </Modal.Content>
    </Modal>
  ),
};
