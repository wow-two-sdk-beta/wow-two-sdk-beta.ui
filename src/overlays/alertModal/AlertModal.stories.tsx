import type { Meta, StoryObj } from '@storybook/react';
import { AlertModal } from './AlertModal';

const meta: Meta<typeof AlertModal> = {
  title: 'Overlays/AlertModal',
  component: AlertModal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AlertModal>;

export const Destructive: Story = {
  render: () => (
    <AlertModal>
      <AlertModal.Trigger className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
        Delete account
      </AlertModal.Trigger>
      <AlertModal.Content>
        <AlertModal.Header>
          <AlertModal.Title>Are you absolutely sure?</AlertModal.Title>
          <AlertModal.Description>
            This action cannot be undone. This will permanently delete your account and remove
            your data from our servers.
          </AlertModal.Description>
        </AlertModal.Header>
        <AlertModal.Footer>
          <AlertModal.Cancel>Cancel</AlertModal.Cancel>
          <AlertModal.Action
            onAction={() => alert('Deleted!')}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertModal.Action>
        </AlertModal.Footer>
      </AlertModal.Content>
    </AlertModal>
  ),
};
