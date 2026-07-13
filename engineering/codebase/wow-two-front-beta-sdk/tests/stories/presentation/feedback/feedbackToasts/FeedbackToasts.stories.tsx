import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor, within } from 'storybook/test';

import { createFeedbackBus, notify, NoticeTone } from '@src/feedback';
import { feedbackQueryErrors } from '@src/feedback';
import { ApiError } from '@src/foundation/http';
import { expectDismissed, expectVisible } from '../../../../unit/testing';
import { toaster } from '@src/presentation/feedback/toaster';
import { FeedbackToasts } from '@src/presentation/feedback/feedbackToasts/FeedbackToasts';

const meta: Meta = {
  title: 'Feedback/FeedbackToasts',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

function Demo({ tone }: { tone: NoticeTone }) {
  return (
    <button
      type="button"
      onClick={() =>
        notify({
          tone,
          title: `${tone[0]?.toUpperCase()}${tone.slice(1)} notice`,
          description: 'Published on the feedback bus.',
        })
      }
      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
    >
      Notify {tone}
    </button>
  );
}

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Demo tone={NoticeTone.Info} />
      <Demo tone={NoticeTone.Success} />
      <Demo tone={NoticeTone.Warning} />
      <Demo tone={NoticeTone.Danger} />
      <FeedbackToasts />
    </div>
  ),
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — publish on the module-scope bus (`notify` /
 * `feedbackQueryErrors`, the public API) and assert the notice lands in the
 * Toaster viewport. Every play starts with `dismissAll()` because the toaster
 * store persists across stories (same discipline as Toaster.stories.tsx, whose
 * header also documents the KNOWN exit-ghost bug — untouched here).
 * ------------------------------------------------------------------------- */

const toastViewport = (doc: Document) => {
  const el = doc.querySelector<HTMLElement>('div[aria-label="Notifications"]');
  if (!el) throw new Error('Toaster viewport not mounted');
  return el;
};

export const ForwardsNoticesToToasts: Story = {
  render: () => <FeedbackToasts defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    notify({ tone: NoticeTone.Success, title: 'Saved', description: 'Your changes are live.' });
    notify({ tone: NoticeTone.Danger, title: 'Delete failed' });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));

    const saved = await viewport.findByText('Saved');
    await expectVisible(saved);
    await expect(viewport.getByText('Your changes are live.')).toBeInTheDocument();

    // Tone → toast severity: the danger card carries the danger border class.
    const failed = await viewport.findByText('Delete failed');
    const dangerCard = failed.closest('[role="status"]');
    await expect(dangerCard).toBeTruthy();
    await expect(dangerCard!.className).toContain('border-destructive');

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Saved'));
  },
};

export const ForwardsDurationAndAutoDismisses: Story = {
  render: () => <FeedbackToasts defaultDuration={600} canPauseOnHover={false} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    notify({ tone: NoticeTone.Info, title: 'Ephemeral notice' });
    notify({ tone: NoticeTone.Warning, title: 'Pinned notice', durationMs: Infinity });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    await viewport.findByText('Ephemeral notice');
    await viewport.findByText('Pinned notice');

    // The Toaster default dismisses the first; the notice's `durationMs: Infinity` overrides it.
    await expectDismissed(() => viewport.queryByText('Ephemeral notice'), { timeout: 1500 });
    await expect(viewport.getByText('Pinned notice')).toBeInTheDocument();

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Pinned notice'));
  },
};

const isolatedBus = createFeedbackBus();

export const RendersOnlyItsOwnBus: Story = {
  render: () => <FeedbackToasts bus={isolatedBus} defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    notify({ tone: NoticeTone.Info, title: 'Default-bus notice' }); // not subscribed → dropped
    isolatedBus.notify({ tone: NoticeTone.Success, title: 'Isolated-bus notice' });

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));
    await viewport.findByText('Isolated-bus notice');
    await expect(viewport.queryByText('Default-bus notice')).not.toBeInTheDocument();

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Isolated-bus notice'));
  },
};

export const RendersQueryErrorsAsDangerToasts: Story = {
  render: () => <FeedbackToasts defaultDuration={Infinity} />,
  play: async ({ canvasElement }) => {
    toaster.dismissAll();
    const doc = canvasElement.ownerDocument;

    // The full chain an app wires: createQueryClient({ onError: feedbackQueryErrors() }).
    const onError = feedbackQueryErrors();
    onError(new ApiError(409, { title: 'Slug already taken', detail: 'Pick a different short code.' }));

    await waitFor(() => expect(toastViewport(doc)).toBeTruthy());
    const viewport = within(toastViewport(doc));

    const title = await viewport.findByText('Slug already taken');
    await expectVisible(title);
    await expect(viewport.getByText('Pick a different short code.')).toBeInTheDocument();
    const card = title.closest('[role="status"]');
    await expect(card!.className).toContain('border-destructive');

    toaster.dismissAll();
    await expectDismissed(() => viewport.queryByText('Slug already taken'));
  },
};
