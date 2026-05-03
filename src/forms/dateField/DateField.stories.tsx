import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DateField } from './DateField';

const meta: Meta<typeof DateField> = {
  title: 'Forms/DateField',
  component: DateField,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DateField>;

function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <div className="flex flex-col gap-3 w-72">
      <DateField value={date} onChange={setDate} />
      <p className="text-sm text-muted-foreground">
        Value: {date ? date.toDateString() : 'none'}
      </p>
    </div>
  );
}

export const Default: Story = { render: () => <Demo /> };

export const WithBounds: Story = {
  render: () => {
    const today = new Date();
    const min = new Date(today);
    min.setDate(today.getDate() - 7);
    const max = new Date(today);
    max.setDate(today.getDate() + 14);
    return (
      <div className="w-72">
        <DateField defaultValue={today} min={min} max={max} />
      </div>
    );
  },
};

export const Invalid: Story = {
  render: () => (
    <div className="w-72">
      <DateField state="invalid" />
    </div>
  ),
};
