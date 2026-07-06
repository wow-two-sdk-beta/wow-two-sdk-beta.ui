import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CronInput } from './CronInput';

const meta: Meta<typeof CronInput> = {
  title: 'Forms/CronInput',
  component: CronInput,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof CronInput>;

export const Default: Story = {
  render: () => (
    <div className="w-[26rem] space-y-3">
      <CronInput defaultValue="*/5 * * * *" />
      <CronInput defaultValue="0 9 * * 1,3,5" />
      <CronInput defaultValue="0 0 1 * *" />
      <CronInput defaultValue="*/15 * * * *" />
      <CronInput defaultValue="invalid" />
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* No presets/segments in the first-gen component — a single text input + live
   preview line is the whole surface, so typing IS the interaction. */

export const TypingRewritesCronString: Story = {
  args: { defaultValue: '*/5 * * * *', onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('*/5 * * * *');
    await expect(canvas.getByText('Every 5 minutes')).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, '0 9 * * 1,3,5');
    await expect(input).toHaveValue('0 9 * * 1,3,5');
    /* Spy receives the full string on every edit — assert the settled value. */
    await expect(args.onValueChange).toHaveBeenLastCalledWith('0 9 * * 1,3,5');
    await expect(canvas.getByText('At 09:00 on Monday, Wednesday, Friday')).toBeVisible();
    await expect(input).not.toHaveAttribute('aria-invalid');
  },
};

export const PreviewDescribesCommonSchedules: Story = {
  args: { defaultValue: '0 0 * * *', onValueChange: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await expect(canvas.getByText('Every day at 00:00')).toBeVisible();

    await userEvent.clear(input);
    await userEvent.type(input, '* * * * *');
    await expect(canvas.getByText('Every minute')).toBeVisible();

    /* Uncommon shapes fall back to a per-field description. */
    await userEvent.clear(input);
    await userEvent.type(input, '0 12 1 * *');
    await expect(canvas.getByText('minute: 0 · hour: 12 · day: 1')).toBeVisible();
  },
};

export const InvalidExpressionMarksField: Story = {
  args: { defaultValue: '*/5 * * * *', onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox');
    await expect(input).not.toHaveAttribute('aria-invalid');

    /* Out-of-range field (minute 99) → invalid state + error preview. */
    await userEvent.clear(input);
    await userEvent.type(input, '99 * * * *');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(canvas.getByText('Invalid cron expression.')).toBeVisible();

    /* Wrong arity gets the dedicated 5-field message. */
    await userEvent.clear(input);
    await userEvent.type(input, '* * *');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(
      canvas.getByText('Cron expressions must have 5 fields (min hour dom month dow).'),
    ).toBeVisible();

    /* Fixing the expression clears the error. */
    await userEvent.clear(input);
    await userEvent.type(input, '*/15 * * * *');
    await expect(input).not.toHaveAttribute('aria-invalid');
    await expect(canvas.getByText('Every 15 minutes')).toBeVisible();
    await expect(args.onValueChange).toHaveBeenLastCalledWith('*/15 * * * *');
  },
};
