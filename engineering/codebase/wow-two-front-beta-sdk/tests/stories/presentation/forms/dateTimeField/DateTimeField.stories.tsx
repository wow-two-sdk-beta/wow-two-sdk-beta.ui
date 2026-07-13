import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { expect, fireEvent, within } from 'storybook/test';
import { DateTimeField } from '@src/presentation/forms/dateTimeField/DateTimeField';

const meta: Meta<typeof DateTimeField> = {
  title: 'Forms/DateTimeField',
  component: DateTimeField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DateTimeField>;

function Demo() {
  const [value, setValue] = useState<Temporal.PlainDateTime | null>(null);
  return (
    <div className="flex flex-col gap-3 w-72">
      <DateTimeField value={value} onValueChange={setValue} aria-label="Date and time" />
      <p className="text-sm text-muted-foreground">Value: {value ? value.toString() : 'none'}</p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithBounds: Story = {
  render: () => {
    const now = Temporal.Now.plainDateTimeISO().round({ smallestUnit: 'minute' });
    const min = now.subtract({ days: 7 });
    const max = now.add({ days: 14 });
    return (
      <div className="w-72">
        <DateTimeField defaultValue={now} min={min} max={max} aria-label="Date and time" />
      </div>
    );
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <DateTimeField state="invalid" aria-label="Date and time" />
    </div>
  ),
};

export const Interaction: Story = {
  render: () => <Demo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText('Date and time') as HTMLInputElement;
    // Drive the controlled input via a change event (datetime-local segments make userEvent.type
    // unreliable), asserting the PlainDateTime parse → format round-trip reflects back.
    fireEvent.change(input, { target: { value: '2026-07-11T14:30' } });
    await expect(input.value).toBe('2026-07-11T14:30');
    await expect(canvas.getByText(/2026-07-11T14:30/)).toBeInTheDocument();
  },
};
