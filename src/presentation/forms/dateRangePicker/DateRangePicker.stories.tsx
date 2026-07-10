import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DateRangePicker } from './DateRangePicker';
import type { DateRange } from '../rangeCalendar';

const meta: Meta<typeof DateRangePicker> = {
  title: 'Forms/DateRangePicker',
  component: DateRangePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DateRangePicker>;

function Demo() {
  const [range, setRange] = useState<DateRange | null>(null);
  return (
    <div className="w-96">
      <DateRangePicker value={range} onValueChange={setRange} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const Invalid: Story = {
  render: () => (
    <div className="w-96">
      <DateRangePicker isInvalid placeholder="Required range" />
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* Fixed default range anchors the calendar month + ISO formatter dodges locale drift. */
const FIXED_RANGE: DateRange = {
  start: Temporal.PlainDate.from('2025-06-10'),
  end: Temporal.PlainDate.from('2025-06-20'),
};
const isoFormat = (d: Temporal.PlainDate) => d.toString();

/* The calendar portals to document.body; day cells carry `data-date` (see MonthGrid),
   which disambiguates day numbers duplicated by adjacent-month cells. */
const dayCell = (doc: Document, iso: string): HTMLButtonElement => {
  const cell = doc.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
  if (!cell) throw new Error(`No day cell for ${iso}`);
  return cell;
};

/* Payload carries Temporal.PlainDate ends — compare via toString(), not deep equality. */
const lastRange = (spy: unknown): DateRange | null | undefined => {
  const calls = (spy as { mock: { calls: [DateRange | null][] } }).mock.calls;
  return calls[calls.length - 1]?.[0];
};

export const SelectStartThenEnd: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-96">
      <DateRangePicker {...args} name="trip" defaultValue={FIXED_RANGE} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: '2025-06-10 → 2025-06-20' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    /* First click opens a pending range — the public value clears (a DateRange
       always carries both ends), so the spy fires with null. */
    await userEvent.click(dayCell(doc, '2025-06-05'));
    await expect(args.onValueChange).toHaveBeenLastCalledWith(null);
    /* Still open — only half the range is picked. (Presence check, not toBeVisible:
       the pop-in animation may still be at opacity 0 this early.) */
    await expect(body.getByRole('dialog')).toBeInTheDocument();

    /* Second click finalizes the range and auto-closes the popover. */
    await userEvent.click(dayCell(doc, '2025-06-12'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    const range = lastRange(args.onValueChange);
    await expect(range?.start.toString()).toBe('2025-06-05');
    await expect(range?.end.toString()).toBe('2025-06-12');
    await expect(canvas.getByRole('button', { name: '2025-06-05 → 2025-06-12' })).toBeVisible();

    /* Hidden form inputs ship both ISO ends. */
    await expect(doc.querySelector<HTMLInputElement>('input[name="trip_start"]')?.value).toBe(
      '2025-06-05',
    );
    await expect(doc.querySelector<HTMLInputElement>('input[name="trip_end"]')?.value).toBe(
      '2025-06-12',
    );
  },
};

export const RangeHighlightedInCalendar: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-96">
      <DateRangePicker {...args} defaultValue={FIXED_RANGE} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: '2025-06-10 → 2025-06-20' }));
    await body.findByRole('dialog');

    /* Ends are selected; days strictly between carry the in-range marker. */
    await expect(dayCell(doc, '2025-06-10')).toHaveAttribute('data-range-start');
    await expect(dayCell(doc, '2025-06-10')).toHaveAttribute('aria-selected', 'true');
    await expect(dayCell(doc, '2025-06-20')).toHaveAttribute('data-range-end');
    await expect(dayCell(doc, '2025-06-20')).toHaveAttribute('aria-selected', 'true');
    await expect(dayCell(doc, '2025-06-15')).toHaveAttribute('data-in-range');
    await expect(dayCell(doc, '2025-06-15')).toHaveAttribute('aria-selected', 'false');
    await expect(dayCell(doc, '2025-06-25')).not.toHaveAttribute('data-in-range');
    await expect(dayCell(doc, '2025-06-05')).not.toHaveAttribute('data-in-range');
  },
};

export const BackwardsSelectionSwapsEnds: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-96">
      <DateRangePicker {...args} defaultValue={FIXED_RANGE} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: '2025-06-10 → 2025-06-20' }));
    await body.findByRole('dialog');

    /* Clicking the LATER day first, then an earlier one: ends are sorted, never inverted. */
    await userEvent.click(dayCell(doc, '2025-06-24'));
    await userEvent.click(dayCell(doc, '2025-06-06'));

    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    const range = lastRange(args.onValueChange);
    await expect(range?.start.toString()).toBe('2025-06-06');
    await expect(range?.end.toString()).toBe('2025-06-24');
    await expect(canvas.getByRole('button', { name: '2025-06-06 → 2025-06-24' })).toBeVisible();
  },
};

export const EscapeClosesWithoutCompleting: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-96">
      <DateRangePicker {...args} defaultValue={FIXED_RANGE} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: '2025-06-10 → 2025-06-20' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args.onValueChange).not.toHaveBeenCalled();
  },
};
