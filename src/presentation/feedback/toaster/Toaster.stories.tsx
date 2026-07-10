import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { expectDismissed, expectVisible } from '../../../testing';
import { toaster, useToaster, Toaster } from './Toaster';

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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — drive the imperative `toaster` store directly
 * (it's the public API; the singleton is shared with the story's render).
 * Every play starts with `dismissAll()` because the module store persists
 * across stories in this file. The viewport portals to document.body; the
 * hidden Announce region also carries role="status", so toast queries scope
 * to the viewport (`aria-label="Notifications"`). Auto-dismiss uses SHORT
 * real durations (no fake timers in stories — docs/testing.md).
 *
 * KNOWN BUG (sources untouched; assertions omitted): a dismissed toast leaves
 * `visible` one render before the `exiting` state syncs (effect lag), so its
 * Presence unmounts instantly — the exit slide never plays — and the ghost
 * entry remounted with `isPresent=false` renders null forever, never fires
 * `onRemoved`, and leaks in `exiting`. Consequence: after the first dismissal
 * the empty viewport div never unmounts back to the Announce-only state, so
 * "viewport unmounts when drained" is NOT asserted here.
 * ------------------------------------------------------------------------- */

const toastViewport = (doc: Document) => {
  const el = doc.querySelector<HTMLElement>('div[aria-label="Notifications"]');
  if (!el) throw new Error('Toaster viewport not mounted');
  return el;
};

export const PushesToastImperatively: Story = {
  render: () => <Toaster defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    toaster.toast({ title: 'Saved', description: 'Your changes are live.' });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    const card = await viewport.findByRole('status');
    // Slide-in starts off-canvas — poll past the enter animation.
    await expectVisible(card);
    await expect(card).toHaveAttribute('aria-live', 'polite');
    await expect(card).toHaveTextContent('Saved');
    await expect(card).toHaveTextContent('Your changes are live.');

    // dismissAll drains the queue (the empty viewport div itself lingers — see
    // the exiting-ghost bug in the header comment).
    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Saved'));
  },
};

export const AutoDismissesAfterDuration: Story = {
  render: () => <Toaster defaultDuration={600} canPauseOnHover={false} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    toaster.toast({ title: 'Ephemeral' });
    toaster.toast({ title: 'Pinned', duration: Infinity });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    await viewport.findByText('Ephemeral');
    await viewport.findByText('Pinned');

    // The default duration dismisses the first; the per-toast Infinity overrides it.
    await expectDismissed(() => viewport.queryByText('Ephemeral'), { timeout: 1500 });
    await expect(viewport.getByText('Pinned')).toBeInTheDocument();

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Pinned'));
  },
};

export const CapsVisibleToastsAtMax: Story = {
  render: () => <Toaster max={3} defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    const first = toaster.toast({ title: 'Toast 1' });
    toaster.toast({ title: 'Toast 2' });
    toaster.toast({ title: 'Toast 3' });
    toaster.toast({ title: 'Toast 4' });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));

    // FIFO window: the first three render, the overflow waits in the queue.
    await viewport.findByText('Toast 3');
    await expect(viewport.getByText('Toast 1')).toBeInTheDocument();
    await expect(viewport.getByText('Toast 2')).toBeInTheDocument();
    await expect(viewport.queryByText('Toast 4')).not.toBeInTheDocument();
    await expect(viewport.getAllByRole('status')).toHaveLength(3);

    // Dismissing a visible toast promotes the queued one.
    toaster.dismiss(first);
    await viewport.findByText('Toast 4');
    await expectDismissed(() => viewport.queryByText('Toast 1'));
    await waitFor(() => expect(viewport.getAllByRole('status')).toHaveLength(3));

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByRole('status'));
  },
};

export const DismissButtonRemovesToast: Story = {
  render: () => <Toaster defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    toaster.toast({ title: 'Sticky note' });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    const card = await viewport.findByRole('status');
    await expectVisible(card);

    await userEvent.click(within(card).getByRole('button', { name: 'Dismiss' }));

    await expectDismissed(() => viewport.queryByText('Sticky note'));
  },
};

export const ActionButtonFiresCallback: Story = {
  render: () => <Toaster defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;
    const onAction = fn();

    const id = toaster.toast({
      title: 'File archived',
      action: (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-primary hover:underline"
        >
          Undo
        </button>
      ),
    });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    await viewport.findByText('File archived');

    await userEvent.click(viewport.getByRole('button', { name: 'Undo' }));
    await expect(onAction).toHaveBeenCalledTimes(1);

    // Actions don't auto-dismiss — the consumer closes via the returned id.
    await expect(viewport.getByText('File archived')).toBeInTheDocument();
    toaster.dismiss(id);
    await expectDismissed(() => viewport.queryByText('File archived'));
  },
};
