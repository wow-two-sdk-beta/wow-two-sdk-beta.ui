import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { DatePicker } from '@src/presentation/forms/datePicker/DatePicker';

const meta: Meta<typeof DatePicker> = {
  title: 'Forms/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DatePicker>;

function Demo() {
  const [date, setDate] = useState<Temporal.PlainDate | null>(null);
  return (
    <div className="w-72">
      <DatePicker value={date} onValueChange={setDate} />
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithDefault: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker defaultValue={Temporal.Now.plainDateISO()} />
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <DatePicker isInvalid placeholder="Required" />
    </div>
  ),
};

/* ────────── Interaction tests (play functions — run as browser tests via the vitest addon) ────────── */

/* Fixed anchor date + ISO formatter keep every assertion locale- and today-independent. */
const JUNE_15 = Temporal.PlainDate.from('2025-06-15');
const isoFormat = (d: Temporal.PlainDate) => d.toString();

/* The calendar portals to document.body; day cells carry `data-date` (see MonthGrid),
   which disambiguates day numbers duplicated by adjacent-month cells. */
const dayCell = (doc: Document, iso: string): HTMLButtonElement => {
  const cell = doc.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`);
  if (!cell) throw new Error(`No day cell for ${iso}`);
  return cell;
};

/* Payloads are Temporal.PlainDate — compare via toString(), not deep equality. */
const lastDate = (spy: unknown): Temporal.PlainDate | null | undefined => {
  const calls = (spy as { mock: { calls: [Temporal.PlainDate | null][] } }).mock.calls;
  return calls[calls.length - 1]?.[0];
};

export const SelectDayFromCalendar: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <DatePicker {...args} defaultValue={JUNE_15} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    const trigger = canvas.getByRole('button', { name: '2025-06-15' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);
    await body.findByRole('dialog');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await body.findByText('June 2025');
    await expect(dayCell(doc, '2025-06-15')).toHaveAttribute('aria-selected', 'true');

    await userEvent.click(dayCell(doc, '2025-06-18'));

    /* Selection fills the value and closes the popover (animation-deferred). */
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(args.onValueChange).toHaveBeenCalledTimes(1);
    await expect(lastDate(args.onValueChange)?.toString()).toBe('2025-06-18');
    await expect(canvas.getByRole('button', { name: '2025-06-18' })).toBeVisible();
  },
};

export const MonthNavigation: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <DatePicker {...args} defaultValue={JUNE_15} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: '2025-06-15' }));
    await body.findByRole('dialog');

    await userEvent.click(body.getByRole('button', { name: 'Previous month' }));
    await body.findByText('May 2025');

    await userEvent.click(body.getByRole('button', { name: 'Next month' }));
    await userEvent.click(body.getByRole('button', { name: 'Next month' }));
    await body.findByText('July 2025');

    /* Selecting in the navigated month commits that month's date. */
    await userEvent.click(dayCell(doc, '2025-07-08'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(lastDate(args.onValueChange)?.toString()).toBe('2025-07-08');
    await expect(canvas.getByRole('button', { name: '2025-07-08' })).toBeVisible();
  },
};

export const KeyboardGridNavigation: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <DatePicker {...args} defaultValue={JUNE_15} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const body = within(doc.body);

    await userEvent.click(canvas.getByRole('button', { name: '2025-06-15' }));
    await body.findByRole('dialog');

    /* MonthGrid adopts focus onto the active day cell on a rAF after mount. */
    await waitFor(() => expect(dayCell(doc, '2025-06-15')).toHaveFocus());

    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(dayCell(doc, '2025-06-16')).toHaveFocus());

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(dayCell(doc, '2025-06-23')).toHaveFocus());

    /* Home snaps to the week start (Sunday). */
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(dayCell(doc, '2025-06-22')).toHaveFocus());

    /* Enter activates the focused day: selects + closes. */
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(lastDate(args.onValueChange)?.toString()).toBe('2025-06-22');
  },
};

export const EscapeClosesWithoutSelecting: Story = {
  args: { onValueChange: fn() },
  render: (args) => (
    <div className="w-72">
      <DatePicker {...args} defaultValue={JUNE_15} format={isoFormat} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    const trigger = canvas.getByRole('button', { name: '2025-06-15' });
    await userEvent.click(trigger);
    await body.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
    /* Focus returns to the trigger; the value is untouched. */
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args.onValueChange).not.toHaveBeenCalled();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};
