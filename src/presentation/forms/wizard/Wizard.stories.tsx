import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { Wizard, WizardFooter, WizardStep, WizardSteps } from './Wizard';

const meta: Meta = {
  title: 'Forms/Wizard',
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [name, setName] = useState('');
      const [email, setEmail] = useState('');
      const [done, setDone] = useState(false);
      return (
        <div className="w-[36rem] rounded-md border border-border bg-card p-4">
          <Wizard
            onComplete={async () => {
              await new Promise((r) => setTimeout(r, 600));
              setDone(true);
            }}
          >
            <WizardSteps />
            <WizardStep
              id="account"
              label="Account"
              validate={() => name.length >= 2 || (alert('Name required'), false)}
            >
              <label className="block text-sm">
                Name
                <input
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </WizardStep>
            <WizardStep id="profile" label="Profile">
              <label className="block text-sm">
                Email
                <input
                  type="email"
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </WizardStep>
            <WizardStep id="review" label="Review" isFinal>
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>Name: <strong>{name}</strong></p>
                <p>Email: <strong>{email}</strong></p>
              </div>
              {done && (
                <p className="text-sm text-success">Completed.</p>
              )}
            </WizardStep>
            <WizardFooter />
          </Wizard>
        </div>
      );
    }
    return <Demo />;
  },
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

type WizardPlayArgs = {
  onStepChange: ReturnType<typeof fn>;
  onComplete: ReturnType<typeof fn>;
};
type PlayStory = StoryObj<WizardPlayArgs>;

/* Three plain steps (no validators) — navigation & indicator mechanics only. */
const renderThreeSteps = (args: WizardPlayArgs) => (
  <div className="w-[36rem] rounded-md border border-border bg-card p-4">
    <Wizard onStepChange={args.onStepChange} onComplete={args.onComplete}>
      <WizardSteps />
      <WizardStep id="intro" label="Intro">
        <p>Intro content</p>
      </WizardStep>
      <WizardStep id="details" label="Details">
        <p>Details content</p>
      </WizardStep>
      <WizardStep id="review" label="Review" isFinal>
        <p>Review content</p>
      </WizardStep>
      <WizardFooter />
    </Wizard>
  </div>
);

export const NextAndBackNavigate: PlayStory = {
  args: { onStepChange: fn(), onComplete: fn() },
  render: renderThreeSteps,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    /* One step rendered at a time; no Back button on the first step. */
    await expect(canvas.getByText('Intro content')).toBeVisible();
    await expect(canvas.queryByText('Details content')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Details content')).toBeVisible();
    await expect(args.onStepChange).toHaveBeenLastCalledWith('details');

    /* Last step swaps Next for the submit label. */
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Review content')).toBeVisible();
    await expect(args.onStepChange).toHaveBeenLastCalledWith('review');
    await expect(canvas.getByRole('button', { name: 'Finish' })).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(await canvas.findByText('Details content')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }));
    await expect(await canvas.findByText('Intro content')).toBeVisible();
    /* Back on the first step isn't rendered — can't step before the first. */
    await expect(canvas.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
    await expect(args.onComplete).not.toHaveBeenCalled();
  },
};

export const StepIndicatorTracksStateAndJumps: PlayStory = {
  args: { onStepChange: fn(), onComplete: fn() },
  render: renderThreeSteps,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const tablist = canvas.getByRole('tablist', { name: 'Wizard steps' });
    const tabs = within(tablist).getAllByRole('tab');
    await expect(tabs).toHaveLength(3);

    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[2]).toHaveAttribute('aria-disabled', 'true');

    /* Unvisited steps can't be jumped to. */
    await userEvent.click(tabs[2]!);
    await expect(canvas.getByText('Intro content')).toBeVisible();
    await expect(args.onStepChange).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Details content')).toBeVisible();
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');

    /* Visited steps are jumpable. */
    await expect(tabs[0]).not.toHaveAttribute('aria-disabled');
    await userEvent.click(tabs[0]!);
    await expect(await canvas.findByText('Intro content')).toBeVisible();
    await expect(args.onStepChange).toHaveBeenLastCalledWith('intro');
    /* The final step is still unvisited → still locked. */
    await expect(tabs[2]).toHaveAttribute('aria-disabled', 'true');
  },
};

export const ValidatorGatesAdvance: PlayStory = {
  args: { onStepChange: fn(), onComplete: fn() },
  render: (args) => {
    function Demo() {
      const [name, setName] = useState('');
      return (
        <div className="w-[36rem] rounded-md border border-border bg-card p-4">
          <Wizard onStepChange={args.onStepChange} onComplete={args.onComplete}>
            <WizardSteps />
            <WizardStep id="account" label="Account" validate={() => name.length >= 2}>
              <label className="block text-sm">
                Name
                <input
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            </WizardStep>
            <WizardStep id="done" label="Done" isFinal>
              <p>Done content</p>
            </WizardStep>
            <WizardFooter />
          </Wizard>
        </div>
      );
    }
    return <Demo />;
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    /* Failing validator blocks Next — still on the first step, no step change. */
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(canvas.getByRole('textbox')).toBeVisible();
    await expect(canvas.queryByText('Done content')).not.toBeInTheDocument();
    await expect(args.onStepChange).not.toHaveBeenCalled();

    /* Passing validator lets Next through. */
    await userEvent.type(canvas.getByRole('textbox'), 'Jo');
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Done content')).toBeVisible();
    await expect(args.onStepChange).toHaveBeenLastCalledWith('done');
  },
};

export const FinalStepFiresOnComplete: PlayStory = {
  args: { onStepChange: fn(), onComplete: fn() },
  render: renderThreeSteps,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }));
    await expect(await canvas.findByText('Review content')).toBeVisible();
    await expect(args.onComplete).not.toHaveBeenCalled();

    /* Finish on the final step completes — it does not advance anywhere. */
    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }));
    await waitFor(() => expect(args.onComplete).toHaveBeenCalledTimes(1));
    await expect(canvas.getByText('Review content')).toBeVisible();
    /* Step changes were details → review only; completing fires no extra one. */
    await expect(args.onStepChange).toHaveBeenCalledTimes(2);
  },
};
