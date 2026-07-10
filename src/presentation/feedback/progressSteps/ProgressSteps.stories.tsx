import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { ProgressSteps } from './ProgressSteps';

const meta: Meta<typeof ProgressSteps> = {
  title: 'Feedback/ProgressSteps',
  component: ProgressSteps,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ProgressSteps>;

export const Horizontal: Story = {
  args: { steps: ['Account', 'Profile', 'Verify', 'Done'], current: 2 },
  render: (args) => <div className="w-[40rem]"><ProgressSteps {...args} /></div>,
};
export const Vertical: Story = {
  args: { steps: ['Account', 'Profile', 'Verify', 'Done'], current: 2, orientation: 'vertical' },
};

/* ------------------------------------------------------------------------- *
 * Interaction tests (play) — ProgressSteps is display-only (no state machine,
 * nothing clickable), so these are render-state assertions on the
 * complete / current / upcoming aria + glyph treatment.
 * ------------------------------------------------------------------------- */

export const MarksCompletedCurrentAndUpcomingSteps: Story = {
  args: { steps: ['Account', 'Profile', 'Verify', 'Done'], current: 2 },
  render: (args) => <div className="w-[40rem]"><ProgressSteps {...args} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(4);
    const [account, profile, verify, done] = items;
    if (!account || !profile || !verify || !done) throw new Error('expected 4 step items');

    // Completed steps swap their number for a check glyph and carry no aria-current.
    for (const [step, number] of [[account, '1'], [profile, '2']] as const) {
      await expect(within(step).queryByText(number)).not.toBeInTheDocument();
      await expect(step.querySelector('svg')).not.toBeNull();
      await expect(step.querySelector('[aria-current="step"]')).toBeNull();
    }

    // The current step keeps its number and is the only aria-current="step".
    const current = verify.querySelector('[aria-current="step"]');
    await expect(current).not.toBeNull();
    await expect(current).toHaveTextContent('3');
    await expect(canvasElement.querySelectorAll('[aria-current="step"]')).toHaveLength(1);

    // Upcoming steps stay numbered, un-checked, and un-current.
    await expect(within(done).getByText('4')).toBeInTheDocument();
    await expect(done.querySelector('svg')).toBeNull();
    await expect(done.querySelector('[aria-current="step"]')).toBeNull();
  },
};

export const AllStepsCompleteWhenCurrentIsPastEnd: Story = {
  args: { steps: ['Account', 'Profile', 'Verify'], current: 3 },
  render: (args) => <div className="w-[40rem]"><ProgressSteps {...args} /></div>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const items = canvas.getAllByRole('listitem');
    await expect(items).toHaveLength(3);

    for (const step of items) {
      await expect(step.querySelector('svg')).not.toBeNull();
    }
    for (const number of ['1', '2', '3']) {
      await expect(canvas.queryByText(number)).not.toBeInTheDocument();
    }
    await expect(canvasElement.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
  },
};
