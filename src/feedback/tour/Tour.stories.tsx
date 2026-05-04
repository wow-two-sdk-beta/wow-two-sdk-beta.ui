import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Tour } from './Tour';

const meta: Meta = {
  title: 'Feedback/Tour',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);
      return (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            id="tour-start"
            className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Start tour
          </button>

          <div className="grid grid-cols-3 gap-4">
            <div id="tour-step-1" className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Inbox</h3>
              <p className="mt-1 text-xs text-muted-foreground">All your messages.</p>
            </div>
            <div id="tour-step-2" className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Calendar</h3>
              <p className="mt-1 text-xs text-muted-foreground">Upcoming events.</p>
            </div>
            <div id="tour-step-3" className="rounded-md border border-border bg-card p-4">
              <h3 className="text-sm font-medium">Settings</h3>
              <p className="mt-1 text-xs text-muted-foreground">Customize your account.</p>
            </div>
          </div>

          <Tour
            open={open}
            onOpenChange={setOpen}
            steps={[
              {
                target: '#tour-step-1',
                title: 'Inbox',
                body: 'This is where your messages live. Click to open.',
                placement: 'bottom',
              },
              {
                target: '#tour-step-2',
                title: 'Calendar',
                body: 'Your upcoming events appear here.',
                placement: 'bottom',
              },
              {
                target: '#tour-step-3',
                title: 'Settings',
                body: 'Manage your account and notifications.',
                placement: 'bottom',
              },
            ]}
            onComplete={() => alert('Tour complete!')}
          />
        </div>
      );
    }
    return <Demo />;
  },
};
