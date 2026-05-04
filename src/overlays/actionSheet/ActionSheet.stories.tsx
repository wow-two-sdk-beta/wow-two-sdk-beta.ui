import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ActionSheet, ActionSheetAction, ActionSheetCancel } from './ActionSheet';

const meta: Meta = {
  title: 'Overlays/ActionSheet',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

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
            Open action sheet
          </button>
          <ActionSheet
            open={open}
            onOpenChange={setOpen}
            title="Choose an action"
            description="What would you like to do?"
          >
            <ActionSheetAction onSelect={() => alert('Save')}>Save changes</ActionSheetAction>
            <ActionSheetAction onSelect={() => alert('Share')}>Share</ActionSheetAction>
            <ActionSheetAction destructive onSelect={() => alert('Delete')}>
              Delete
            </ActionSheetAction>
            <ActionSheetCancel />
          </ActionSheet>
        </div>
      );
    }
    return <Demo />;
  },
};
