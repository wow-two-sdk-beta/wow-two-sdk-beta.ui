import type { Meta, StoryObj } from '@storybook/react';
import { useToaster, Toaster } from './Toaster';

const meta: Meta = {
  title: 'Feedback/Toaster',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

function Demo({ severity }: { severity?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }) {
  const { toast } = useToaster();
  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title: severity ? `${severity[0]?.toUpperCase()}${severity.slice(1)} toast` : 'Hello',
          description: 'This is the body of the toast.',
          severity,
        })
      }
      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Push toast
    </button>
  );
}

export const Default: Story = {
  render: () => (
    <div className="space-x-2">
      <Demo />
      <Toaster />
    </div>
  ),
};

export const Severities: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Demo severity="info" />
      <Demo severity="success" />
      <Demo severity="warning" />
      <Demo severity="danger" />
      <Demo severity="neutral" />
      <Toaster />
    </div>
  ),
};

export const TopCenter: Story = {
  render: () => (
    <div className="space-x-2">
      <Demo />
      <Toaster position="top-center" />
    </div>
  ),
};

export const Sticky: Story = {
  render: () => {
    function Stick() {
      const { toast } = useToaster();
      return (
        <button
          type="button"
          onClick={() => toast({ title: 'Sticky', description: 'Stays until dismissed.', duration: Infinity })}
          className="inline-flex h-9 items-center rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
        >
          Push sticky
        </button>
      );
    }
    return (
      <div className="space-x-2">
        <Stick />
        <Toaster />
      </div>
    );
  },
};
