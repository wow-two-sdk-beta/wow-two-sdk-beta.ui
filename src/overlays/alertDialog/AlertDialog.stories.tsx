import type { Meta, StoryObj } from '@storybook/react';
import { AlertDialog } from './AlertDialog';

const meta: Meta<typeof AlertDialog> = {
  title: 'Overlays/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof AlertDialog>;

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialog.Trigger className="rounded-md bg-destructive px-3 py-1.5 text-sm text-destructive-foreground">
        Delete account
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
          <AlertDialog.Description>
            This action cannot be undone. This will permanently delete your account and remove
            your data from our servers.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
          <AlertDialog.Action
            onAction={() => alert('Deleted!')}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog>
  ),
};
