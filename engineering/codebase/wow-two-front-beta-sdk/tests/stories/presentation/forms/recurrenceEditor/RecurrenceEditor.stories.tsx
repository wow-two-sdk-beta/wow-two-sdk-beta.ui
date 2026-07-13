import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RecurrenceEditor, type RecurrenceRule } from '@src/presentation/forms/recurrenceEditor/RecurrenceEditor';

const meta: Meta<typeof RecurrenceEditor> = {
  title: 'Forms/RecurrenceEditor',
  component: RecurrenceEditor,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof RecurrenceEditor>;

export const Default: Story = {
  render: () => {
    function Demo() {
      const [rule, setRule] = useState<RecurrenceRule>({
        freq: 'WEEKLY',
        interval: 1,
        byDay: ['MO', 'WE', 'FR'],
      });
      return (
        <div className="w-[28rem] space-y-3">
          <RecurrenceEditor value={rule} onValueChange={setRule} />
          <pre className="rounded-md bg-muted p-2 text-xs">{JSON.stringify(rule, null, 2)}</pre>
        </div>
      );
    }
    return <Demo />;
  },
};

export const Monthly: Story = {
  render: () => (
    <div className="w-[28rem]">
      <RecurrenceEditor defaultValue={{ freq: 'MONTHLY', interval: 1, byMonthDay: 15 }} />
    </div>
  ),
};

export const WithCount: Story = {
  render: () => (
    <div className="w-[28rem]">
      <RecurrenceEditor defaultValue={{ freq: 'DAILY', interval: 1, count: 10 }} />
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* Fixed `from` anchor (a Monday) keeps the occurrence preview date-independent. */
const FROM = Temporal.PlainDate.from('2025-06-02');
const WEEKLY_MO: RecurrenceRule = { freq: 'WEEKLY', interval: 1, byDay: ['MO'] };

/* Payload is a RecurrenceRule object — read it off the spy for field-level asserts. */
const lastRule = (spy: unknown): RecurrenceRule | undefined => {
  const calls = (spy as { mock: { calls: [RecurrenceRule][] } }).mock.calls;
  return calls[calls.length - 1]?.[0];
};

export const FrequencySwitchesDependentControls: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-[28rem]">
      <RecurrenceEditor {...args} defaultValue={WEEKLY_MO} from={FROM} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const freq = canvas.getByRole('combobox', { name: 'Frequency' });

    /* WEEKLY → weekday row visible, no month-day input. */
    await expect(canvas.getByRole('group', { name: 'Days of week' })).toBeVisible();
    await expect(canvas.getByRole('checkbox', { name: 'Mo' })).toHaveAttribute(
      'aria-checked',
      'true',
    );

    /* MONTHLY → weekday row swaps for the month-day input; byDay is reset. */
    await userEvent.selectOptions(freq, 'MONTHLY');
    await expect(canvas.queryByRole('group', { name: 'Days of week' })).not.toBeInTheDocument();
    await expect(canvas.getByText('On day')).toBeVisible();
    let rule = lastRule(args.onValueChange);
    await expect(rule?.freq).toBe('MONTHLY');
    await expect(rule?.byDay).toBeUndefined();

    /* DAILY → both dependent controls gone; preview lists consecutive days. */
    await userEvent.selectOptions(freq, 'DAILY');
    await expect(canvas.queryByRole('group', { name: 'Days of week' })).not.toBeInTheDocument();
    await expect(canvas.queryByText('On day')).not.toBeInTheDocument();
    rule = lastRule(args.onValueChange);
    await expect(rule?.freq).toBe('DAILY');
    await expect(rule?.byMonthDay).toBeUndefined();
    await expect(canvas.getByText('2025-06-02')).toBeVisible();
    await expect(canvas.getByText('2025-06-06')).toBeVisible();
  },
};

export const WeekdayTogglesUpdateRuleAndPreview: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-[28rem]">
      <RecurrenceEditor {...args} defaultValue={WEEKLY_MO} from={FROM} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    /* Toggle We on → byDay grows; preview picks up Wednesdays. */
    const wednesday = canvas.getByRole('checkbox', { name: 'We' });
    await expect(wednesday).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(wednesday);
    await expect(wednesday).toHaveAttribute('aria-checked', 'true');
    await expect(lastRule(args.onValueChange)?.byDay).toEqual(['MO', 'WE']);
    await expect(canvas.getByText('2025-06-04')).toBeVisible();
    await expect(canvas.getByText('2025-06-09')).toBeVisible();

    /* Toggle Mo off — only Wednesdays remain. */
    const monday = canvas.getByRole('checkbox', { name: 'Mo' });
    await userEvent.click(monday);
    await expect(monday).toHaveAttribute('aria-checked', 'false');
    await expect(lastRule(args.onValueChange)?.byDay).toEqual(['WE']);
    await expect(canvas.getByText('2025-06-11')).toBeVisible();
    await expect(canvas.queryByText('2025-06-09')).not.toBeInTheDocument();
  },
};

export const EndModeControlsRuleAndSerialization: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-[28rem]">
      <RecurrenceEditor {...args} name="rec" defaultValue={WEEKLY_MO} from={FROM} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const hidden = (): string =>
      canvasElement.querySelector<HTMLInputElement>('input[name="rec"]')?.value ?? '';

    const radios = within(canvas.getByRole('radiogroup', { name: 'End mode' })).getAllByRole(
      'radio',
    );
    await expect(radios).toHaveLength(3);
    await expect(radios[0]).toBeChecked(); // never
    await expect(hidden()).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO');

    /* After N occurrences — defaults to 10, enables the count input. */
    await userEvent.click(radios[1]!);
    await expect(radios[1]).toBeChecked();
    await expect(lastRule(args.onValueChange)?.count).toBe(10);
    /* The count input is the only control showing "10" — enabled now that count mode is on. */
    await expect(canvas.getByDisplayValue('10')).toBeEnabled();
    await expect(hidden()).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=10');

    /* Until a date — defaults to from + 6 months; count clears. */
    await userEvent.click(radios[2]!);
    await expect(radios[2]).toBeChecked();
    const untilRule = lastRule(args.onValueChange);
    await expect(untilRule?.until?.toString()).toBe('2025-12-02');
    await expect(untilRule?.count).toBeUndefined();
    await expect(hidden()).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20251202');

    /* Back to never — both end fields clear. */
    await userEvent.click(radios[0]!);
    const neverRule = lastRule(args.onValueChange);
    await expect(neverRule?.count).toBeUndefined();
    await expect(neverRule?.until).toBeNull();
    await expect(hidden()).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO');
  },
};
