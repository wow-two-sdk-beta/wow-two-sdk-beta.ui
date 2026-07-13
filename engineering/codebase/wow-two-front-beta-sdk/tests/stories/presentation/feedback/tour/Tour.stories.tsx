import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Tour } from '@src/presentation/feedback/tour/Tour';

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
            isOpen={open}
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

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — the tooltip portals to document.body as a
 * non-modal `role="dialog"`, so open-state queries go through
 * `canvasElement.ownerDocument.body`. Target resolution is deferred a frame
 * and enter/exit pop via Presence → poll with `waitFor`. Target highlighting
 * is an SVG mask whose black cutout rect must track the step target's
 * bounding box (± the default 8px padding).
 * ------------------------------------------------------------------------- */

type PlayArgs = {
  onComplete: ReturnType<typeof fn>;
  onSkip: ReturnType<typeof fn>;
  onStepChange: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<PlayArgs>;

const playTourDemo = (args: PlayArgs) => {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Start tour
        </button>

        <div className="grid grid-cols-3 gap-4">
          <div id="play-tour-1" className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Inbox</h3>
          </div>
          <div id="play-tour-2" className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Calendar</h3>
          </div>
          <div id="play-tour-3" className="rounded-md border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Settings</h3>
          </div>
        </div>

        <Tour
          isOpen={open}
          onOpenChange={setOpen}
          steps={[
            { target: '#play-tour-1', title: 'Inbox', body: 'Messages live here.', placement: 'bottom' },
            { target: '#play-tour-2', title: 'Calendar', body: 'Upcoming events.', placement: 'bottom' },
            { target: '#play-tour-3', title: 'Settings', body: 'Tune your account.', placement: 'bottom' },
          ]}
          onStepChange={args.onStepChange}
          onComplete={args.onComplete}
          onSkip={args.onSkip}
        />
      </div>
    );
  }
  return <Demo />;
};

/** Asserts the scrim's mask cutout hugs the target's box (default 8px padding). */
const expectCutoutAround = async (doc: Document, targetSelector: string) => {
  await waitFor(() => {
    const target = doc.querySelector(targetSelector);
    const cutout = doc.querySelector('mask rect[fill="black"]');
    if (!target || !cutout) throw new Error('tour cutout or target not found');
    const box = target.getBoundingClientRect();
    const attr = (name: string) => parseFloat(cutout.getAttribute(name) ?? 'NaN');
    expect(Math.abs(attr('x') - (box.left - 8))).toBeLessThanOrEqual(1.5);
    expect(Math.abs(attr('y') - (box.top - 8))).toBeLessThanOrEqual(1.5);
    expect(Math.abs(attr('width') - (box.width + 16))).toBeLessThanOrEqual(2);
    expect(Math.abs(attr('height') - (box.height + 16))).toBeLessThanOrEqual(2);
  });
};

export const NavigatesStepsAndCompletes: PlayStory = {
  args: { onComplete: fn(), onSkip: fn(), onStepChange: fn() },
  render: playTourDemo,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Start tour' }));

    // Step 1 — content, counter, highlight; no Back on the first step.
    const dialog = await body.findByRole('dialog');
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(dialog).toHaveAccessibleName('Inbox');
    await expect(within(dialog).getByText('Messages live here.')).toBeInTheDocument();
    await expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();
    await expect(within(dialog).queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    await expectCutoutAround(doc, '#play-tour-1');

    // Next — advances, highlight tracks the new target.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await expect(args.onStepChange).toHaveBeenCalledWith(1);
    await expect(within(dialog).getByText('2 / 3')).toBeInTheDocument();
    await expect(dialog).toHaveAccessibleName('Calendar');
    await expectCutoutAround(doc, '#play-tour-2');

    // Back — returns to the previous step.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Back' }));
    await expect(args.onStepChange).toHaveBeenCalledWith(0);
    await expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();

    // Forward to the last step — the affirmative button becomes Done.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }));
    await expect(within(dialog).getByText('3 / 3')).toBeInTheDocument();
    await expectCutoutAround(doc, '#play-tour-3');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));
    await expect(args.onComplete).toHaveBeenCalledTimes(1);
    await expect(args.onSkip).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const EscapeSkipsTour: PlayStory = {
  args: { onComplete: fn(), onSkip: fn(), onStepChange: fn() },
  render: playTourDemo,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Start tour' }));
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');

    await expect(args.onSkip).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

export const SkipButtonDismisses: PlayStory = {
  args: { onComplete: fn(), onSkip: fn(), onStepChange: fn() },
  render: playTourDemo,
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'Start tour' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Skip' }));

    await expect(args.onSkip).toHaveBeenCalledTimes(1);
    await expect(args.onComplete).not.toHaveBeenCalled();
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
