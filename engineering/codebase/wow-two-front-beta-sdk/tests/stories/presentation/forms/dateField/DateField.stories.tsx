import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Temporal } from 'temporal-polyfill';
import { DateField } from '@src/presentation/forms/dateField/DateField';

const meta: Meta<typeof DateField> = {
  title: 'Forms/DateField',
  component: DateField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DateField>;

function Demo() {
  const [date, setDate] = useState<Temporal.PlainDate | null>(null);
  return (
    <div className="flex flex-col gap-3 w-72">
      <DateField value={date} onValueChange={setDate} aria-label="Date" />
      <p className="text-sm text-muted-foreground">
        Value: {date ? date.toString() : 'none'}
      </p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithBounds: Story = {
  render: () => {
    const today = Temporal.Now.plainDateISO();
    const min = today.subtract({ days: 7 });
    const max = today.add({ days: 14 });
    return (
      <div className="w-72">
        <DateField defaultValue={today} min={min} max={max} aria-label="Date" />
      </div>
    );
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <DateField state="invalid" aria-label="Date" />
    </div>
  ),
};
